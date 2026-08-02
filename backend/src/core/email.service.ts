import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string =
    process.env.EMAIL_FROM || 'Hosped <onboarding@resend.dev>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('EmailService inicializado com Resend.');
    } else {
      this.logger.warn(
        '[EmailService] RESEND_API_KEY não configurada. E-mails serão logados no console (modo dev).',
      );
    }
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<boolean> {
    const html = this.buildPasswordResetHtml(resetLink);

    if (!this.resend) {
      // Modo dev: apenas loga o link
      this.logger.log(
        `\n\n[DEV] Password reset link para ${email}:\n${resetLink}\n\n`,
      );
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: 'Redefinição de senha - Hosped',
        html,
      });

      if (error) {
        this.logger.error(
          `Erro ao enviar e-mail de reset para ${email}:`,
          error,
        );
        return false;
      }

      this.logger.log(`E-mail de reset enviado para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar e-mail para ${email}:`, err);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, nome: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.log(`[DEV] Welcome e-mail para ${email} (${nome})`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: 'Bem-vindo ao Hosped! 🏨',
        html: this.buildWelcomeHtml(nome),
      });

      if (error) {
        this.logger.error(
          `Erro ao enviar welcome e-mail para ${email}:`,
          error,
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar welcome e-mail para ${email}:`, err);
      return false;
    }
  }

  // ── Novos métodos da Jornada do Hóspede ──────────────────────────────

  /**
   * E-mail de confirmação de reserva (disparado logo após a criação)
   */
  async sendConfirmationEmail(
    email: string,
    guestName: string,
    checkIn: string,
    checkOut: string,
    hotelName: string,
    roomCategory: string,
    guestToken: string,
    hotelSlug: string,
  ): Promise<boolean> {
    const guestPortalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${guestToken}`;
    const html = this.buildConfirmationHtml(guestName, checkIn, checkOut, hotelName, roomCategory, guestPortalUrl);

    if (!this.resend) {
      this.logger.log(`\n\n[DEV] Confirmação de reserva para ${email}:\n${guestPortalUrl}\n\n`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `Reserva Confirmada — ${hotelName} 🏨`,
        html,
      });
      if (error) { this.logger.error(`Erro ao enviar confirmação para ${email}:`, error); return false; }
      this.logger.log(`Confirmação enviada para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar confirmação para ${email}:`, err);
      return false;
    }
  }

  /**
   * E-mail de pré-check-in (lembrete para enviar documento antes da chegada)
   */
  async sendPreCheckInEmail(
    email: string,
    guestName: string,
    guestToken: string,
    hotelSlug: string,
  ): Promise<boolean> {
    const preCheckInUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${guestToken}/pre-checkin`;
    const html = this.buildPreCheckInHtml(guestName, preCheckInUrl);

    if (!this.resend) {
      this.logger.log(`\n\n[DEV] Pré-check-in para ${email}:\n${preCheckInUrl}\n\n`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: 'Pré-check-in — Agilize sua chegada 🚀',
        html,
      });
      if (error) { this.logger.error(`Erro ao enviar pré-check-in para ${email}:`, error); return false; }
      this.logger.log(`Pré-check-in enviado para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar pré-check-in para ${email}:`, err);
      return false;
    }
  }

  /**
   * E-mail de boas-vindas (disparado no check-in)
   */
  async sendWelcomeOnArrivalEmail(
    email: string,
    guestName: string,
    roomNumber: string,
    hotelName: string,
    checkOut: string,
  ): Promise<boolean> {
    const html = this.buildWelcomeOnArrivalHtml(guestName, roomNumber, hotelName, checkOut);

    if (!this.resend) {
      this.logger.log(`\n\n[DEV] Welcome on arrival para ${email} (${guestName} — ${hotelName})\n\n`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `Bem-vindo(a), ${guestName}! Sua hospedagem começou 🎉`,
        html,
      });
      if (error) { this.logger.error(`Erro ao enviar welcome on arrival para ${email}:`, error); return false; }
      this.logger.log(`Welcome on arrival enviado para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar welcome on arrival para ${email}:`, err);
      return false;
    }
  }

  /**
   * E-mail de lembrete de check-out
   */
  async sendCheckOutReminderEmail(
    email: string,
    guestName: string,
    checkOutDate: string,
    hotelName: string,
    hotelSlug: string,
    guestToken: string,
  ): Promise<boolean> {
    const billUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${guestToken}/extrato`;
    const html = this.buildCheckOutReminderHtml(guestName, checkOutDate, hotelName, billUrl);

    if (!this.resend) {
      this.logger.log(`\n\n[DEV] Check-out reminder para ${email}:\nCheck-out: ${checkOutDate}\n\n`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `${hotelName} — Lembrete de Check-out ✅`,
        html,
      });
      if (error) { this.logger.error(`Erro ao enviar check-out reminder para ${email}:`, error); return false; }
      this.logger.log(`Check-out reminder enviado para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar check-out reminder para ${email}:`, err);
      return false;
    }
  }

  /**
   * E-mail pós-estadia (agradecimento e feedback)
   */
  async sendPostStayEmail(
    email: string,
    guestName: string,
    hotelName: string,
    hotelSlug: string,
    guestToken: string,
  ): Promise<boolean> {
    const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${hotelSlug}/hospede/${guestToken}/feedback`;
    const html = this.buildPostStayHtml(guestName, hotelName, feedbackUrl);

    if (!this.resend) {
      this.logger.log(`\n\n[DEV] Pós-estadia para ${email} (${guestName} — ${hotelName})\n\n`);
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `Como foi sua estadia no ${hotelName}? 💬`,
        html,
      });
      if (error) { this.logger.error(`Erro ao enviar pós-estadia para ${email}:`, error); return false; }
      this.logger.log(`Pós-estadia enviado para ${email}`);
      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar pós-estadia para ${email}:`, err);
      return false;
    }
  }

  // ── Template builders ───────────────────────────────────────────────

  private buildConfirmationHtml(
    guestName: string,
    checkIn: string,
    checkOut: string,
    hotelName: string,
    roomCategory: string,
    guestPortalUrl: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Reserva Confirmada</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="display:inline-flex;align-items:center;gap:10px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
</div></td></tr>
<tr><td style="padding:40px;">
<h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">Reserva Confirmada ✅</h1>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Olá <strong style="color:#fff;">${guestName}</strong>, sua reserva no <strong style="color:#fff;">${hotelName}</strong> foi confirmada com sucesso!</p>
<table width="100%" cellpadding="10" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:12px;margin:24px 0;">
<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Check-in</td><td style="color:#fff;font-size:14px;font-weight:600;">${checkIn}</td></tr>
<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Check-out</td><td style="color:#fff;font-size:14px;font-weight:600;">${checkOut}</td></tr>
<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Categoria</td><td style="color:#fff;font-size:14px;font-weight:600;">${roomCategory}</td></tr>
</table>
<div style="text-align:center;margin:32px 0;">
<a href="${guestPortalUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">Acessar Painel do Hóspede</a>
</div>
<p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.5;margin:8px 0 0 0;">No painel você pode fazer o pré-check-in, consultar seu extrato e muito mais.</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira</p>
</td></tr></table>
</td></tr></table></body></html>`;
  }

  private buildPreCheckInHtml(guestName: string, preCheckInUrl: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Pré-check-in</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="display:inline-flex;align-items:center;gap:10px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
</div></td></tr>
<tr><td style="padding:40px;">
<h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">Pré-check-in Disponível 🚀</h1>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Olá <strong style="color:#fff;">${guestName}</strong>, sua chegada está próxima! Faça o pré-check-in agora para agilizar seu atendimento na recepção.</p>
<div style="text-align:center;margin:32px 0;">
<a href="${preCheckInUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">Fazer Pré-check-in</a>
</div>
<p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.5;margin:8px 0 0 0;">Basta enviar seu documento de identificação com antecedência e evitar filas.</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira</p>
</td></tr></table>
</td></tr></table></body></html>`;
  }

  private buildWelcomeOnArrivalHtml(guestName: string, roomNumber: string, hotelName: string, checkOut: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Bem-vindo</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="display:inline-flex;align-items:center;gap:10px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
</div></td></tr>
<tr><td style="padding:40px;">
<h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">Bem-vindo(a), ${guestName}! 🎉</h1>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Sua hospedagem no <strong style="color:#fff;">${hotelName}</strong> já começou. Desejamos uma estadia maravilhosa!</p>
<table width="100%" cellpadding="10" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:12px;margin:24px 0;">
<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Quarto</td><td style="color:#fff;font-size:14px;font-weight:600;">${roomNumber}</td></tr>
<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;width:40%;">Check-out</td><td style="color:#fff;font-size:14px;font-weight:600;">${checkOut}</td></tr>
</table>
<p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">Precisa de algo? É só falar com nossa equipe na recepção ou ligar para o ramal 0. Estamos aqui para ajudar! 😊</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira</p>
</td></tr></table>
</td></tr></table></body></html>`;
  }

  private buildCheckOutReminderHtml(guestName: string, checkOutDate: string, hotelName: string, billUrl: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Lembrete de Check-out</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="display:inline-flex;align-items:center;gap:10px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
</div></td></tr>
<tr><td style="padding:40px;">
<h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">Check-out Amanhã 🧳</h1>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Olá <strong style="color:#fff;">${guestName}</strong>, seu check-out no <strong style="color:#fff;">${hotelName}</strong> está agendado para <strong style="color:#fff;">${checkOutDate}</strong>.</p>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Confira seu extrato e realize o pagamento de forma antecipada para agilizar sua saída.</p>
<div style="text-align:center;margin:32px 0;">
<a href="${billUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">Ver Extrato</a>
</div>
<p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.5;margin:8px 0 0 0;">Horário de check-out: até as 12h. Se precisar de mais tempo, consulte a recepção.</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira</p>
</td></tr></table>
</td></tr></table></body></html>`;
  }

  private buildPostStayHtml(guestName: string, hotelName: string, feedbackUrl: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Feedback</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="display:inline-flex;align-items:center;gap:10px;">
<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
</div></td></tr>
<tr><td style="padding:40px;">
<h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">Obrigado por se hospedar! 💛</h1>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Olá <strong style="color:#fff;">${guestName}</strong>, esperamos que tenha gostado da sua estadia no <strong style="color:#fff;">${hotelName}</strong>.</p>
<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">Sua opinião é muito importante para nós! Leva apenas 1 minutinho para responder.</p>
<div style="text-align:center;margin:32px 0;">
<a href="${feedbackUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">Avaliar Minha Estadia</a>
</div>
<p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.5;margin:8px 0 0 0;">Voltaremos em breve com ofertas especiais para você! 🎁</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira</p>
</td></tr></table>
</td></tr></table></body></html>`;
  }

  private buildPasswordResetHtml(resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de Senha</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">
                Redefinição de Senha 🔑
              </h1>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong style="color:rgba(255,255,255,0.85);">15 minutos</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
                  Redefinir Senha
                </a>
              </div>
              <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.5;margin:28px 0 0 0;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
                Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.<br/><br/>
                Ou copie e cole este link no navegador:<br/>
                <span style="color:#3b82f6;word-break:break-all;font-size:12px;">${resetLink}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildWelcomeHtml(nome: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao Hosped</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:inline-block;vertical-align:middle;"></div>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;">Hosped</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.5px;">
                Bem-vindo, ${nome}! 🏨
              </h1>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 20px 0;">
                Sua conta no <strong style="color:#fff;">Hosped</strong> foi criada com sucesso. Você já pode acessar o painel de controle e começar a gerenciar seu hotel de forma profissional.
              </p>
              <ul style="color:rgba(255,255,255,0.6);font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px 0;">
                <li>📅 Gestão de reservas e disponibilidade</li>
                <li>🛏️ Controle de quartos e categorias</li>
                <li>💰 Financeiro integrado com Mercado Pago</li>
                <li>🤖 Motor de reservas online</li>
              </ul>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://app.hosped.com.br'}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                  Acessar o Painel
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Hosped · Sistema de Gestão Hoteleira
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
