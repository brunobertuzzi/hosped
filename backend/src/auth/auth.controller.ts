import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    return result;
  }

  @Post('register')
  async register(@Body() data: any) {
    return this.authService.register(data);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  // --- SUPER ADMIN IMPERSONATION ---
  @Post('impersonate/:hotelId')
  @UseGuards(AuthGuard) // Supondo que será substituído ou checado. Usaremos o token do Super Admin.
  // Idealmente: @Roles(Role.PLATFORM_OWNER) + RolesGuard, mas faremos a checagem no Service para garantir.
  async impersonate(
    @Param('hotelId') hotelId: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.impersonate(hotelId, req.user);

    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  // --- TEAM MANAGEMENT ---
  @UseGuards(AuthGuard)
  @Get('team')
  async getTeam(@Request() req: any) {
    return this.authService.getTeam(req.user?.hotelId);
  }

  @UseGuards(AuthGuard)
  @Post('team')
  async createTeamMember(@Body() data: any, @Request() req: any) {
    return this.authService.createTeamMember(
      req.user?.hotelId,
      req.user?.branchId,
      data,
    );
  }

  @UseGuards(AuthGuard)
  @Post('team/:id/status')
  async updateTeamMemberStatus(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.authService.updateTeamMemberStatus(
      id,
      data.status,
      req.user?.hotelId,
    );
  }

  @UseGuards(AuthGuard)
  @Post('team/:id') // Using POST to match other methods, or PUT if we prefer. But let's use PUT to be RESTful.
  async updateTeamMember(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.authService.updateTeamMember(
      id,
      data,
      req.user?.hotelId,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() data: { email: string }) {
    return this.authService.forgotPassword(data.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: { email: string, token: string, password: string }) {
    return this.authService.resetPassword(data.email, data.token, data.password);
  }
}
