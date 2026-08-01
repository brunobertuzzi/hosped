import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string = process.env.EMAIL_FROM || 'Hosped <onboarding@resend.dev>';

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
        this.logger.error(`Erro ao enviar e-mail de reset para ${email}:`, error);
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
        this.logger.error(`Erro ao enviar welcome e-mail para ${email}:`, error);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Falha ao enviar welcome e-mail para ${email}:`, err);
      return false;
    }
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
