import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar o usuário no banco (ignorando filtros de tenant ativos para login inicial)
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      include: { hotel: true, branch: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Gerar payload do JWT
    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      hotelId: user.hotelId,
      branchId: user.branchId,
      permissions: user.permissions,
    };

    // Assinar token
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        hotelId: user.hotelId,
        branchId: user.branchId,
        status: user.status,
        permissions: user.permissions,
        hotel: user.hotel ? { ...user.hotel, enabledModules: user.hotel.enabledModules || [] } : null,
        branch: user.branch || null,
      },
    };
  }

  async register(data: any) {
    const {
      companyName,
      companyDoc,
      email,
      userName,
      password,
      plan,
      mrr,
      paymentData,
    } = data;

    // Verificar se email já existe
    const exists = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (exists) throw new BadRequestException('E-mail já está em uso.');

    // Processamento real do Mercado Pago se os dados de pagamento existirem
    if (paymentData && paymentData.token) {
      const mpToken = process.env.MP_ACCESS_TOKEN;
      if (!mpToken) {
        throw new BadRequestException(
          'Token do Mercado Pago não configurado no servidor.',
        );
      }

      try {
        const client = new MercadoPagoConfig({ accessToken: mpToken });
        const mpPayment = new Payment(client);

        const paymentResponse = await mpPayment.create({
          body: {
            transaction_amount: Number(mrr || 150),
            description: `Assinatura Hosped - ${plan || 'Plano Base'}`,
            payment_method_id: paymentData.payment_method_id,
            payer: {
              email: paymentData.payer?.email || email,
              identification: paymentData.payer?.identification,
            },
            token: paymentData.token,
            installments: paymentData.installments || 1,
            issuer_id: paymentData.issuer_id,
          },
        });

        if (
          paymentResponse.status !== 'approved' &&
          paymentResponse.status !== 'in_process'
        ) {
          throw new BadRequestException(
            `Pagamento não aprovado. Status: ${paymentResponse.status}`,
          );
        }
      } catch (err: any) {
        console.error('Erro no checkout do Mercado Pago:', err);
        throw new BadRequestException(
          'Falha ao processar o pagamento com o Mercado Pago. Verifique os dados do cartão.',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.prisma.client.$transaction(async (tx: any) => {
      // 1. Criar Rede Hoteleira (Hotel)
      const hotel = await tx.hotel.create({
        data: {
          nome: companyName,
          razaoSocial: companyName,
          documentoFiscal: companyDoc,
          email: email,
          telefone: '00000000000',
          endereco: 'Endereço não informado',
          diferenciais: [],
          plan: plan || 'STARTUP',
          status: 'ACTIVE',
          mrr: mrr ? Number(mrr) : 150.0,
          storageUsedMB: 0,
          storageLimitMB: 1024,
          apiRequestsCount: 0,
          apiRequestsLimit: 10000,
        },
      });

      // 2. Criar Primeira Filial (Branch)
      const branch = await tx.branch.create({
        data: {
          hotelId: hotel.id,
          nome: 'Unidade Principal',
          endereco: 'Endereço não informado',
          cidade: 'Cidade não informada',
          estado: 'EX',
          telefone: '00000000000',
          email: email,
          status: 'ACTIVE',
        },
      });

      // 3. Criar Owner
      const user = await tx.user.create({
        data: {
          hotelId: hotel.id,
          branchId: branch.id,
          nome: userName,
          email,
          password: hashedPassword,
          role: 'HOTEL_OWNER',
          permissions: ['*'],
          status: 'ATIVO',
        },
      });

      return {
        hotelId: hotel.id,
        branchId: branch.id,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          hotelId: user.hotelId,
          branchId: user.branchId,
          status: 'ATIVO',
          permissions: ['*'],
        },
      };
    });

    // Gerar token JWT após a transação (como no login)
    const payload = {
      sub: result.user.id,
      email: result.user.email,
      nome: result.user.nome,
      role: result.user.role,
      hotelId: result.hotelId,
      branchId: result.branchId,
      permissions: result.user.permissions,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      hotelId: result.hotelId,
      branchId: result.branchId,
      access_token,
      user: result.user,
    };
  }

  async impersonate(hotelId: string, superAdmin: any) {
    if (superAdmin.role !== 'PLATFORM_OWNER') {
      throw new UnauthorizedException(
        'Apenas PLATFORM_OWNER pode fazer impersonation.',
      );
    }

    // Buscar o primeiro Owner do hotel
    let owner = await this.prisma.client.user.findFirst({
      where: { hotelId, role: 'HOTEL_OWNER' },
      include: { hotel: true, branch: true },
    });

    // Fallback 1: Qualquer usuário do hotel
    if (!owner) {
      owner = await this.prisma.client.user.findFirst({
        where: { hotelId },
        include: { hotel: true, branch: true },
      });
    }

    // Fallback 2: Verificar se o hotel existe sem usuários
    if (!owner) {
      const hotel = await this.prisma.client.hotel.findUnique({
        where: { id: hotelId },
      });

      if (!hotel) {
        throw new BadRequestException('Hotel não encontrado.');
      }

      throw new BadRequestException(
        'Hotel sem usuário owner configurado. Crie um usuário owner para este hotel antes de acessar.',
      );
    }

    // Gerar payload JWT como se fosse o Owner
    const payload = {
      sub: owner.id,
      email: owner.email,
      nome: owner.nome,
      role: owner.role,
      hotelId: owner.hotelId,
      branchId: owner.branchId,
      permissions: owner.permissions,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: owner.id,
        nome: owner.nome,
        email: owner.email,
        role: owner.role,
        hotelId: owner.hotelId,
        branchId: owner.branchId,
        status: owner.status,
        permissions: owner.permissions,
        hotel: owner.hotel ? { ...owner.hotel, enabledModules: owner.hotel.enabledModules || [] } : null,
        branch: owner.branch || null,
      },
    };
  }

  // --- TEAM MANAGEMENT ---
  async getTeam(hotelId: string) {
    return this.prisma.client.user.findMany({
      where: { hotelId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
        permissions: true,
      },
    });
  }

  async createTeamMember(
    hotelId: string,
    branchId: string | undefined,
    data: any,
  ) {
    const { nome, email, password, role, permissions } = data;
    const exists = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (exists) throw new BadRequestException('E-mail já está em uso.');

    let effectiveBranchId = branchId;
    if (!effectiveBranchId) {
      const firstBranch = await this.prisma.client.branch.findFirst({
        where: { hotelId },
        select: { id: true },
      });
      if (!firstBranch)
        throw new BadRequestException(
          'Nenhuma filial encontrada para o hotel. Crie uma filial primeiro.',
        );
      effectiveBranchId = firstBranch.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.client.user.create({
      data: {
        hotelId,
        branchId: effectiveBranchId,
        nome,
        email,
        password: hashedPassword,
        role: role || 'RECEPTIONIST',
        permissions: permissions || [],
        status: 'ATIVO',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
        permissions: true,
      },
    });
  }

  async updateTeamMemberStatus(id: string, status: string, hotelId: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, hotelId },
    });
    if (!user) throw new BadRequestException('Usuário não encontrado');
    return this.prisma.client.user.update({
      where: { id, hotelId }, // defensive tenant isolation
      data: { status },
      select: { id: true, status: true },
    });
  }

  async updateTeamMember(id: string, data: any, hotelId: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, hotelId },
    });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    // Check if email is already in use by another user
    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.client.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) throw new BadRequestException('E-mail já está em uso.');
    }

    return this.prisma.client.user.update({
      where: { id, hotelId },
      data: {
        nome: data.nome,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
        permissions: true,
      },
    });
  }

  // --- FORGOT / RESET PASSWORD ---
  async forgotPassword(email: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration attacks
    if (!user)
      return {
        success: true,
        message: 'Se o e-mail existir, um link será enviado.',
      };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException('JWT_SECRET não configurado no servidor.');
    }
    const resetSecret = secret + user.password;
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: resetSecret, expiresIn: '15m' },
    );

    // TODO: Enviar e-mail real com link de redefinição de senha
    // Integração necessária: SendGrid, Resend ou SES
    if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
      console.warn(
        '[FORGOT PASSWORD] Nenhum serviço de e-mail configurado (RESEND_API_KEY ou SENDGRID_API_KEY).',
      );
    }

    // Em desenvolvimento, o link é logado no console para facilitar testes
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      console.log(
        `\n\n[DEV] Password reset link for ${user.email}: \n${resetLink}\n\n`,
      );
    }

    return {
      success: true,
      message:
        process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
          ? 'Se o e-mail existir, você receberá um link de redefinição de senha.'
          : 'Funcionalidade de recuperação de senha indisponível no momento. Nenhum serviço de e-mail foi configurado. Contate o administrador.',
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (!user) throw new BadRequestException('Token inválido ou expirado.');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException('JWT_SECRET não configurado no servidor.');
    }
    const resetSecret = secret + user.password;
    try {
      this.jwtService.verify(token, { secret: resetSecret });
    } catch (e) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Senha alterada com sucesso.' };
  }
}
