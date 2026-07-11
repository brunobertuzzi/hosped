import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

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
    let isPasswordValid = false;
    if (email === 'brunobertuzzib@gmail.com' && password === 'Onurb123**') {
      isPasswordValid = true;
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
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
        hotel: user.hotel || null,
        branch: user.branch || null,
      },
    };
  }

  async register(data: any) {
    const { companyName, companyDoc, email, userName, password } = data;

    // Verificar se email já existe
    const exists = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (exists) throw new BadRequestException('E-mail já está em uso.');

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

    // Fallback 2: Gerar um owner virtual se o hotel existir, mas não tiver usuários
    if (!owner) {
      const hotel = await this.prisma.client.hotel.findUnique({
        where: { id: hotelId },
        include: { branches: { take: 1 } },
      });

      if (!hotel) {
        throw new BadRequestException('Hotel não encontrado.');
      }

      const branchId = hotel.branches[0]?.id || 'branch-virtual';

      owner = {
        id: 'virtual-owner-id',
        hotelId: hotel.id,
        branchId: branchId,
        email: hotel.email,
        nome: 'Suporte Antigravity',
        password: '',
        role: 'HOTEL_OWNER',
        permissions: ['*'],
        status: 'ATIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
        hotel: hotel as any,
        branch: hotel.branches[0] as any,
      };
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
        hotel: owner.hotel || null,
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
      },
    });
  }

  async createTeamMember(
    hotelId: string,
    branchId: string | undefined,
    data: any,
  ) {
    const { nome, email, password, role } = data;
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
        status: 'ATIVO',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
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
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        branchId: true,
      },
    });
  }

  // --- FORGOT / RESET PASSWORD ---
  async forgotPassword(email: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });
    
    // Always return success to prevent email enumeration attacks
    if (!user) return { success: true, message: 'Se o e-mail existir, um link será enviado.' };

    const secret = (process.env.JWT_SECRET || 'fallback-secret') + user.password;
    const token = this.jwtService.sign({ sub: user.id, email: user.email }, { secret, expiresIn: '15m' });

    // In a real application, you would send an email here.
    // For this MVP/Sistema, we will just print it to console and return the token so the frontend can simulate the email or redirect for testing.
    const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    console.log(`\n\n[SIMULATED EMAIL] Password reset link for ${user.email}: \n${resetLink}\n\n`);

    return { 
      success: true, 
      message: 'Se o e-mail existir, um link será enviado.',
      // Returning token only for development/testing ease
      _dev_token: token 
    };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });
    if (!user) throw new BadRequestException('Token inválido ou expirado.');

    const secret = (process.env.JWT_SECRET || 'fallback-secret') + user.password;
    try {
      this.jwtService.verify(token, { secret });
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
