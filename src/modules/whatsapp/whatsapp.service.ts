import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private twilioClient: Twilio.Twilio;

  constructor() {
    this.twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async enviarMensagem(to: string, body: string): Promise<void> {
    try {
      const message = await this.twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `whatsapp:${to}`,
        body,
      });
      this.logger.log(`[WhatsApp] Mensagem enviada para ${to}: ${message.sid}`);
    } catch (error) {
      this.logger.error(`[WhatsApp] Erro ao enviar mensagem para ${to}:`, error.message);
      throw error; // Or handle silently
    }
  }

  async enviarConfirmacao(
    numeroWhatsapp: string,
    cliente: string,
    profissional: string,
    servico: string,
    data: Date,
  ): Promise<void> {
    const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const mensagem = `Olá ${cliente}! Sua consulta com ${profissional} está confirmada para ${dataFormatada}. Até logo!`;
    await this.enviarMensagem(numeroWhatsapp, mensagem);
  }

  async enviarLembrete(
    numeroWhatsapp: string,
    cliente: string,
    hora: string,
  ): Promise<void> {
    const mensagem = `Olá ${cliente}! Lembrete: sua consulta é hoje às ${hora}.`;
    await this.enviarMensagem(numeroWhatsapp, mensagem);
  }
}