import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Configuração do transporter de email
    // Pode usar SMTP ou serviço de email como SendGrid, Mailgun, etc.
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (smtpConfig.auth.user && smtpConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(smtpConfig);
    } else {
      console.warn('Email service não configurado. Configure SMTP_USER e SMTP_PASS no .env');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service não disponível. Email não enviado para:', to);
      return false;
    }

    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gost.com';
      
      await this.transporter.sendMail({
        from: `GOST Airsoft <${from}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Remove HTML tags para versão texto
        html,
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  async sendRecruitmentConfirmation(data: {
    nome: string;
    email: string;
    telefone?: string;
    idade?: number;
    cidade?: string;
    experiencia?: string;
    equipamento?: string;
    disponibilidade?: string;
    motivacao?: string;
    instagram?: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #1f2937; }
          .value { color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GOST Airsoft</h1>
            <h2>Confirmação de Inscrição</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${data.nome}</strong>,</p>
            <p>Recebemos sua inscrição para o processo de recrutamento do GOST Airsoft!</p>
            <p>Analisaremos seu perfil e entraremos em contato em breve.</p>
            
            <h3>Dados da sua inscrição:</h3>
            <div class="field">
              <span class="label">Nome:</span>
              <span class="value">${data.nome}</span>
            </div>
            <div class="field">
              <span class="label">Email:</span>
              <span class="value">${data.email}</span>
            </div>
            ${data.telefone ? `<div class="field"><span class="label">Telefone:</span><span class="value">${data.telefone}</span></div>` : ''}
            ${data.idade ? `<div class="field"><span class="label">Idade:</span><span class="value">${data.idade} anos</span></div>` : ''}
            ${data.cidade ? `<div class="field"><span class="label">Cidade:</span><span class="value">${data.cidade}</span></div>` : ''}
            ${data.experiencia ? `<div class="field"><span class="label">Experiência:</span><span class="value">${data.experiencia}</span></div>` : ''}
            ${data.equipamento ? `<div class="field"><span class="label">Equipamento:</span><span class="value">${data.equipamento}</span></div>` : ''}
            ${data.disponibilidade ? `<div class="field"><span class="label">Disponibilidade:</span><span class="value">${data.disponibilidade}</span></div>` : ''}
            ${data.instagram ? `<div class="field"><span class="label">Instagram:</span><span class="value">@${data.instagram.replace('@', '')}</span></div>` : ''}
            ${data.motivacao ? `<div class="field"><span class="label">Motivação:</span><span class="value">${data.motivacao}</span></div>` : ''}
            
            <p style="margin-top: 30px;">Atenciosamente,<br>Equipe GOST Airsoft</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(
      data.email,
      'Confirmação de Inscrição - GOST Airsoft',
      html
    );
  }

  async sendStageUpdate(data: {
    nome: string;
    email: string;
    etapa: string;
    status: 'aprovado' | 'reprovado';
    observacoes?: string;
  }): Promise<boolean> {
    const statusText = data.status === 'aprovado' ? 'Aprovado' : 'Reprovado';
    const statusColor = data.status === 'aprovado' ? '#10b981' : '#ef4444';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .status { background-color: ${statusColor}; color: white; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GOST Airsoft</h1>
            <h2>Atualização do Processo de Recrutamento</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${data.nome}</strong>,</p>
            <p>Informamos sobre a atualização do seu processo de recrutamento:</p>
            
            <div class="status">
              <h3>Etapa: ${data.etapa}</h3>
              <h3>Status: ${statusText}</h3>
            </div>
            
            ${data.observacoes ? `<p><strong>Observações:</strong></p><p>${data.observacoes}</p>` : ''}
            
            <p style="margin-top: 30px;">Atenciosamente,<br>Equipe GOST Airsoft</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(
      data.email,
      `Atualização do Recrutamento - ${data.etapa} - ${statusText}`,
      html
    );
  }
}

