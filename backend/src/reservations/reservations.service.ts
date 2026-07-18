import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CheckInDto } from './dto/check-in.dto';
import { AddConsumptionDto } from './dto/add-consumption.dto';
import {
  ReservationStatus,
  RoomStatus,
  AuditAction,
  MovementType,
  Prisma,
} from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Cria uma reserva garantindo segurança contra overbooking usando transações concorrentes Serializable
   */
  async createReservation(dto: CreateReservationDto, userId?: string) {
    const {
      guestName,
      guestDocument,
      guestEmail,
      guestTelefone,
      categoryId,
      branchId,
      dataCheckIn,
      dataCheckOut,
      valorTotal,
      origem,
    } = dto;

    const checkInDate = new Date(dataCheckIn);
    const checkOutDate = new Date(dataCheckOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'A data de check-in deve ser anterior à data de check-out.',
      );
    }

    // Executar todo o fluxo de verificação e criação em uma transação Serializable
    return this.prisma.client.$transaction(
      async (tx: any) => {
        // 1. Obter a categoria do quarto para verificar o valor base
        const category = await tx.roomCategory.findUnique({
          where: { id: categoryId },
        });
        if (!category) {
          throw new NotFoundException('Categoria de quarto não encontrada.');
        }

        // 2. Contar quartos físicos ATIVOS (não bloqueados) na filial para essa categoria
        const totalRooms = await tx.room.count({
          where: {
            branchId,
            categoryId,
            status: {
              notIn: [RoomStatus.BLOQUEADO], // Quartos bloqueados permanentemente não entram na capacidade
            },
          },
        });

        if (totalRooms === 0) {
          throw new BadRequestException(
            'Não existem quartos físicos disponíveis nesta categoria nesta filial.',
          );
        }

        // Quartos disponíveis efetivos para o cálculo (não subtraímos manutenção ativa pois ela pode ser resolvida antes do check-in futuro. Quartos permanentemente inativos já são filtrados pelo status BLOQUEADO).
        const effectiveTotalRooms = totalRooms;

        // 4. Buscar reservas ativas conflitantes no mesmo período para a mesma categoria
        const conflictingReservationsCount = await tx.reservation.count({
          where: {
            branchId,
            categoryId,
            status: {
              notIn: [ReservationStatus.CANCELADA, ReservationStatus.NO_SHOW],
            },
            // Conflito de datas:
            // (DataCheckInReserva <= checkOutDate) AND (DataCheckOutReserva >= checkInDate)
            dataCheckIn: { lte: checkOutDate },
            dataCheckOut: { gte: checkInDate },
          },
        });

        // 5. Validar overbooking
        if (conflictingReservationsCount >= effectiveTotalRooms) {
          throw new BadRequestException(
            `Sem quartos disponíveis. Capacidade esgotada para a categoria "${category.nome}" no período selecionado. ` +
              `(Disponíveis: ${effectiveTotalRooms}, Reservados: ${conflictingReservationsCount})`,
          );
        }

        // 6. Criar ou buscar o hóspede (Guest)
        // prisma.service injeta automaticamente o hotelId ativo
        const hotelIdForTx = category.hotelId;
        let guest = await tx.guest.findFirst({
          where: { documento: guestDocument },
        });

        if (!guest) {
          guest = await tx.guest.create({
            data: {
              hotelId: hotelIdForTx,
              nome: guestName,
              documento: guestDocument,
              email: guestEmail,
              telefone: guestTelefone,
            },
          });
        } else {
          guest = await tx.guest.update({
            where: { id: guest.id },
            data: {
              nome: guestName,
              email: guestEmail,
              telefone: guestTelefone,
            },
          });
        }

        // Calcula o valor total no backend de forma segura com suporte a tarifas de temporada (Yield)
        const tariffs = await tx.tariff.findMany({
          where: { categoryId, hotelId: hotelIdForTx },
          include: { season: true },
        });

        let calculatedValorTotal = new Prisma.Decimal(0);
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const noites = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        for (let i = 0; i < (noites > 0 ? noites : 1); i++) {
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + i);

          const activeTariff = tariffs.find((t: any) => {
            const sStart = new Date(t.season.dataInicio);
            const sEnd = new Date(t.season.dataFim);
            return currentDate >= sStart && currentDate <= sEnd;
          });

          const nightPrice = activeTariff
            ? activeTariff.valor
            : category.valorBase;
          calculatedValorTotal = calculatedValorTotal.add(
            new Prisma.Decimal(nightPrice),
          );
        }

        // 7. Criar a reserva (explicit hotelId defensive + extension)
        const reservation = await tx.reservation.create({
          data: {
            hotelId: hotelIdForTx,
            branchId,
            guestId: guest.id,
            categoryId,
            dataCheckIn: checkInDate,
            dataCheckOut: checkOutDate,
            valorTotal: calculatedValorTotal,
            status: ReservationStatus.PENDENTE,
            origem,
          },
          include: { guest: true, category: true },
        });

        // 8. Auditar a ação
        await this.audit.log(
          userId,
          AuditAction.CRIAR,
          'RESERVATION',
          null,
          reservation,
        );

        this.eventEmitter.emit('reservation.created', reservation);

        return reservation;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Realiza o Check-in manual, vinculando um quarto físico vago e alterando status
   */
  async checkIn(id: string, dto: CheckInDto, userId?: string) {
    return this.prisma.client.$transaction(async (tx: any) => {
      // 1. Buscar a reserva
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: { guest: true },
      });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (
        reservation.status !== ReservationStatus.PENDENTE &&
        reservation.status !== ReservationStatus.CONFIRMADA
      ) {
        throw new BadRequestException(
          'Check-in só é permitido para reservas Pendentes ou Confirmadas.',
        );
      }

      let selectedRoomId = dto.roomId;

      // 2. Se nenhum quarto físico foi passado, buscar um quarto vago (status = DISPONIVEL) na categoria
      if (!selectedRoomId) {
        const availableRoom = await tx.room.findFirst({
          where: {
            branchId: reservation.branchId,
            categoryId: reservation.categoryId,
            status: RoomStatus.DISPONIVEL,
          },
        });

        if (!availableRoom) {
          throw new BadRequestException(
            'Não há quartos físicos livres no momento para realizar o check-in.',
          );
        }

        selectedRoomId = availableRoom.id;
      } else {
        // Validar quarto passado pelo usuário
        const room = await tx.room.findUnique({
          where: { id: selectedRoomId },
        });
        if (!room) {
          throw new NotFoundException('Quarto físico não encontrado.');
        }
        if (room.status !== RoomStatus.DISPONIVEL) {
          throw new BadRequestException(
            `O quarto ${room.numero} não está vago no momento (Status: ${room.status}).`,
          );
        }
      }

      // 3. Atualizar quarto físico para ocupado
      const previousRoom = await tx.room.findUnique({
        where: { id: selectedRoomId },
      });
      const updatedRoom = await tx.room.update({
        where: { id: selectedRoomId },
        data: { status: RoomStatus.OCUPADO },
      });

      // Auditar alteração do quarto
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'ROOM',
        previousRoom,
        updatedRoom,
      );

      // 4. Atualizar status da reserva
      const previousReservation = { ...reservation };
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: {
          roomId: selectedRoomId,
          status: ReservationStatus.HOSPEDADO,
          checkInAt: new Date(),
          documentoCheckIn: dto.documentoCheckIn,
        },
        include: { room: true },
      });

      // Auditar alteração da reserva
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'RESERVATION',
        previousReservation,
        updatedReservation,
      );

      return updatedReservation;
    });
  }

  /**
   * Lança consumo na hospedagem, reduz estoque automaticamente e atualiza valor total da conta
   */
  async addConsumption(
    reservationId: string,
    dto: AddConsumptionDto,
    userId?: string,
  ) {
    return this.prisma.client.$transaction(async (tx: any) => {
      // 1. Buscar a reserva
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (
        reservation.status !== ReservationStatus.HOSPEDADO &&
        reservation.status !== ReservationStatus.CHECK_IN_REALIZADO
      ) {
        throw new BadRequestException(
          'Consumos só podem ser lançados para hóspedes atualmente hospedados.',
        );
      }

      // 2. Buscar item de estoque na mesma filial
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
      });

      if (!item) {
        throw new NotFoundException('Item de estoque não encontrado.');
      }

      if (item.branchId !== reservation.branchId) {
        throw new BadRequestException(
          'Este item de estoque pertence a outra filial.',
        );
      }

      // 3. Validar estoque suficiente
      if (item.quantidade < dto.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o item "${item.nome}". (Disponível: ${item.quantidade}, Solicitado: ${dto.quantidade})`,
        );
      }

      // 4. Deduzir quantidade do estoque do item
      const previousItem = { ...item };
      const updatedItem = await tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: {
          quantidade: item.quantidade - dto.quantidade,
        },
      });

      // 5. Registrar movimentação de saída do estoque (explicit hotelId defensive)
      await tx.inventoryMovement.create({
        data: {
          hotelId: reservation.hotelId || item.hotelId,
          itemId: item.id,
          tipo: MovementType.SAIDA,
          quantidade: dto.quantidade,
          motivo: `VENDA_CONSUMO (Reserva #${reservation.id.substring(0, 8)})`,
        },
      });

      // 6. Criar o lançamento de consumo (explicit hotelId defensive)
      const valorTotalItem = new Prisma.Decimal(item.valorVenda).mul(
        dto.quantidade,
      );
      const consumption = await tx.consumption.create({
        data: {
          hotelId: reservation.hotelId,
          reservationId,
          descricao: `${dto.quantidade}x ${item.nome}`,
          quantidade: dto.quantidade,
          valorUnitario: item.valorVenda,
          valorTotal: valorTotalItem,
        },
      });

      // 7. Atualizar o valor total da reserva somando o consumo
      const previousReservation = { ...reservation };
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          valorTotal: new Prisma.Decimal(reservation.valorTotal).add(
            valorTotalItem,
          ),
        },
      });

      // Auditar movimentação do estoque e consumo
      await this.audit.log(
        userId,
        AuditAction.ATUALIZAR,
        'INVENTORY',
        previousItem,
        updatedItem,
      );

      await this.audit.log(
        userId,
        AuditAction.ATUALIZAR,
        'RESERVATION',
        previousReservation,
        updatedReservation,
      );

      return { consumption, reservation: updatedReservation };
    });
  }

  /**
   * Realiza o Check-out manual após validação financeira estrita de débitos pendentes
   */
  async checkOut(id: string, userId?: string) {
    return this.prisma.client.$transaction(async (tx: any) => {
      // 1. Buscar reserva com pagamentos e consumos
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: {
          payments: true,
          consumptions: true,
        },
      });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (reservation.status !== ReservationStatus.HOSPEDADO) {
        throw new BadRequestException(
          'Checkout só é permitido para reservas com status Hospedado.',
        );
      }

      // 2. Calcular total pago com Prisma.Decimal
      const totalPaid = reservation.payments
        .filter((p: any) => p.status === 'APROVADO')
        .reduce(
          (sum: any, p: any) => sum.add(new Prisma.Decimal(p.valor)),
          new Prisma.Decimal(0),
        );

      const totalCharges = new Prisma.Decimal(reservation.valorTotal);

      // 3. Validação financeira estrita
      if (totalPaid.lt(totalCharges)) {
        const missingAmount = totalCharges.sub(totalPaid).toFixed(2);
        throw new BadRequestException(
          `Checkout negado. Há pendências financeiras em aberto no valor de R$ ${missingAmount}. ` +
            `(Total da Conta: R$ ${totalCharges.toFixed(2)}, Pago: R$ ${totalPaid.toFixed(2)})`,
        );
      }

      // 4. Liberar o quarto físico para limpeza
      if (reservation.roomId) {
        const previousRoom = await tx.room.findUnique({
          where: { id: reservation.roomId },
        });
        const updatedRoom = await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: RoomStatus.LIMPEZA },
        });

        // Auditar liberação do quarto
        await this.audit.log(
          userId,
          AuditAction.MUDANCA_STATUS,
          'ROOM',
          previousRoom,
          updatedRoom,
        );
      }

      // 5. Atualizar status da reserva para Checkout Realizado
      const previousReservation = { ...reservation };
      // Omitir relations de include para evitar objetos circulares grandes no histórico
      delete previousReservation.payments;
      delete previousReservation.consumptions;

      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECK_OUT_REALIZADO,
          checkOutAt: new Date(),
        },
      });

      // Auditar finalização da reserva
      await this.audit.log(
        userId,
        AuditAction.MUDANCA_STATUS,
        'RESERVATION',
        previousReservation,
        updatedReservation,
      );

      return updatedReservation;
    });
  }

  /**
   * Consulta reservas ativas/pendentes na filial com paginação
   */
  async findAllPaginated(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const whereClause = status ? { status: status as ReservationStatus } : {};

    const [data, total] = await Promise.all([
      this.prisma.client.reservation.findMany({
        where: whereClause,
        include: { guest: true, category: true, room: true },
        orderBy: { dataCheckIn: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.client.reservation.count({ where: whereClause }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findAll(status?: string) {
    const whereClause = status ? { status: status as ReservationStatus } : {};
    return this.prisma.client.reservation.findMany({
      where: whereClause,
      include: { guest: true, category: true, room: true },
      orderBy: { dataCheckIn: 'asc' },
    });
  }

  /**
   * Obtém detalhes de uma reserva específica
   */
  async findOne(id: string) {
    const reservation = await this.prisma.client.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        category: true,
        room: true,
        consumptions: true,
        payments: true,
      },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }
    return reservation;
  }

  /**
   * Cancela uma reserva
   */
  async cancelReservation(id: string, userId?: string) {
    return this.prisma.client.$transaction(async (tx: any) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada.');
      }

      if (reservation.status === ReservationStatus.CANCELADA) {
        throw new BadRequestException('Esta reserva já está cancelada.');
      }

      const previousReservation = { ...reservation };
      const updatedReservation = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELADA },
      });

      // Se havia quarto alocado, liberar para limpeza
      if (
        reservation.roomId &&
        reservation.status !== ReservationStatus.CHECK_OUT_REALIZADO
      ) {
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: RoomStatus.LIMPEZA },
        });
      }

      await this.audit.log(
        userId,
        AuditAction.CANCELAR,
        'RESERVATION',
        previousReservation,
        updatedReservation,
      );

      return updatedReservation;
    });
  }

  async updateReservation(id: string, data: any, userId?: string) {
    const prev = await this.prisma.client.reservation.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Reserva não encontrada');
    const updated = await this.prisma.client.reservation.update({
      where: { id },
      data,
    });
    await this.audit.log(
      userId,
      AuditAction.MUDANCA_STATUS,
      'RESERVATION',
      prev,
      updated,
    );
    return updated;
  }

  async deleteReservation(id: string, userId?: string) {
    const prev = await this.prisma.client.reservation.findUnique({
      where: { id },
    });
    if (!prev) throw new NotFoundException('Reserva não encontrada');
    const deleted = await this.prisma.client.reservation.delete({
      where: { id },
    });
    await this.audit.log(
      userId,
      AuditAction.DELETAR,
      'RESERVATION',
      prev,
      deleted,
    );
    return deleted;
  }

  /**
   * Registra um pagamento manual (dinheiro, PIX recebido presencialmente, etc.)
   * sem integração com gateway de pagamento.
   */
  async recordManualPayment(
    reservationId: string,
    valor: number,
    metodo: string,
    userId?: string,
  ) {
    const reservation = await this.prisma.client.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (valor <= 0) {
      throw new BadRequestException('O valor do pagamento deve ser maior que zero.');
    }

    const validMethods = ['PIX', 'CARTAO', 'DINHEIRO'];
    const normalizedMethod = (metodo || '').toUpperCase();
    if (!validMethods.includes(normalizedMethod)) {
      throw new BadRequestException(`Método de pagamento inválido. Valores aceitos: ${validMethods.join(', ')}`);
    }

    const payment = await this.prisma.client.payment.create({
      data: {
        hotelId: reservation.hotelId,
        reservationId,
        valor,
        metodo: normalizedMethod as any,
        status: 'APROVADO',
        transacaoId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    });

    await this.audit.log(
      userId,
      AuditAction.PAGAMENTO_REGISTRADO,
      'PAYMENT',
      { reservationId, valor: 0 },
      payment,
    );

    return payment;
  }

  /**
   * Completa o pré-check-in do hóspede (envio de documento antes da chegada)
   * Endpoint público, sem autenticação.
   */
  async preCheckIn(guestToken: string, documentoCheckIn: string) {
    const reservation = await this.prisma.client.reservation.findUnique({
      where: { id: guestToken },
      include: { guest: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (!['CONFIRMADA', 'PENDENTE'].includes(reservation.status)) {
      throw new BadRequestException(
        'Pré-check-in disponível apenas para reservas confirmadas ou pendentes.',
      );
    }

    if (!documentoCheckIn || documentoCheckIn.trim().length < 4) {
      throw new BadRequestException('Documento de identificação é obrigatório.');
    }

    // Atualizar documento no guest e na reserva
    const [updatedGuest, updatedReservation] = await this.prisma.client.$transaction([
      this.prisma.client.guest.update({
        where: { id: reservation.guestId },
        data: { documento: documentoCheckIn },
      }),
      this.prisma.client.reservation.update({
        where: { id: guestToken },
        data: { documentoCheckIn },
      }),
    ]);

    return {
      success: true,
      message: 'Pré-check-in realizado com sucesso.',
      guest: updatedGuest,
      reservation: updatedReservation,
    };
  }
}
