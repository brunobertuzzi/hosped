import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../core/prisma.service';
import { Prisma, ReservationStatus, RoomStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BookingEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getPublicHotelData(hotelId: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(hotelId);
    
    const hotel = await this.prisma.client.hotel.findFirst({
      where: isUuid ? { id: hotelId } : { slug: hotelId },
      include: {
        branches: true,
        roomCategories: true,
        rooms: {
          where: { status: { notIn: [RoomStatus.BLOQUEADO] } },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel não encontrado');
    }

    // Retorna dados seguros para visualização pública
    return {
      hotel: {
        id: hotel.id,
        nome: hotel.nome,
        razaoSocial: hotel.razaoSocial,
        documentoFiscal: hotel.documentoFiscal,
        logo: hotel.logo,
        banner: hotel.banner,
        cores: hotel.cores,
        layout: hotel.layout,
        slogan: hotel.slogan,
        descricaoPublica: hotel.descricaoPublica,
        diferenciais: hotel.diferenciais,
      },
      branches: hotel.branches,
      roomCategories: hotel.roomCategories,
      rooms: hotel.rooms,
    };
  }
  // Consulta pública de disponibilidade para o site do hotel
  async checkAvailability(
    hotelId: string,
    branchId: string,
    checkIn: string,
    checkOut: string,
  ) {
    const cacheKey = `avail:${hotelId}:${branchId}:${checkIn}:${checkOut}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'A data de check-in deve ser anterior à data de check-out.',
      );
    }

    // Busca todas as categorias deste hotel/filial
    const categories = await this.prisma.client.roomCategory.findMany({
      where: { hotelId },
    });

    const availabilityResult = [];

    for (const category of categories) {
      // 1. Total de quartos físicos ativos para a categoria
      const totalRooms = await this.prisma.client.room.count({
        where: {
          branchId,
          categoryId: category.id,
          status: { notIn: [RoomStatus.BLOQUEADO] },
        },
      });

      // 2. Conta reservas conflitantes no período
      const conflictingReservationsCount =
        await this.prisma.client.reservation.count({
          where: {
            branchId,
            categoryId: category.id,
            status: {
              notIn: [ReservationStatus.CANCELADA, ReservationStatus.NO_SHOW],
            },
            dataCheckIn: { lte: checkOutDate },
            dataCheckOut: { gte: checkInDate },
          },
        });

      const availableCount = totalRooms - conflictingReservationsCount;

      availabilityResult.push({
        category,
        availableRooms: availableCount > 0 ? availableCount : 0,
        isAvailable: availableCount > 0,
        pricePerNight: category.valorBase,
      });
    }

    await this.cacheManager.set(cacheKey, availabilityResult, 60000); // Cache por 1 minuto

    return availabilityResult;
  }

  // Criação de reserva a partir da página pública (Motor de Reservas)
  async publicReserve(hotelId: string, branchId: string, dto: any) {
    // Reutilizar lógica complexa de reservas já existente,
    // mas chamando o prisma com tenant manual
    // Para simplificar no MVP:
    return this.prisma.client.$transaction(async (tx: any) => {
      // Cria hóspede se não existir
      let guest = await tx.guest.findUnique({
        where: {
          hotelId_documento: { hotelId, documento: dto.guestDocument },
        },
      });

      if (!guest) {
        guest = await tx.guest.create({
          data: {
            hotelId,
            nome: dto.guestName,
            documento: dto.guestDocument,
            email: dto.guestEmail,
            telefone: dto.guestPhone,
          },
        });
      }

      const checkInDate = new Date(dto.checkIn);
      const checkOutDate = new Date(dto.checkOut);
      const category = await tx.roomCategory.findUnique({
        where: { id: dto.categoryId },
      });

      const noites = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const valorTotal = new Prisma.Decimal(category.valorBase).mul(
        noites > 0 ? noites : 1,
      );

      const reservation = await tx.reservation.create({
        data: {
          hotelId,
          branchId,
          guestId: guest.id,
          categoryId: dto.categoryId,
          dataCheckIn: checkInDate,
          dataCheckOut: checkOutDate,
          valorTotal,
          status: ReservationStatus.PENDENTE,
          origem: 'ONLINE_BOOKING_ENGINE',
        },
        include: { guest: true, category: true, hotel: true },
      });

      this.eventEmitter.emit('reservation.created', reservation);

      return reservation;
    });
  }
}
