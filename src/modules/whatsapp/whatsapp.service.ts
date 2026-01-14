import { Injectable, Logger } from '@nestjs/common';
import { MensagensTemplate } from './mensagens.template';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async enviarConfirmacao(
    numeroWhatsapp: string,
    cliente: string,
    profissional: string,
    servico: string,
    data: Date,
  ): Promise<void> {
    const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const mensagem = MensagensTemplate.CONFIRMACAO(cliente, profissional, servico, dataFormatada);
    // Simulação do envio
    this.logger.log(`[WhatsApp] Enviando confirmação para ${numeroWhatsapp}: ${mensagem}`);
    // Aqui você integraria com API real, ex: axios.post(...)
  }

  async enviarLembrete(
    numeroWhatsapp: string,
    cliente: string,
    hora: string,
  ): Promise<void> {
    const mensagem = MensagensTemplate.LEMBRETE(cliente, hora);
    this.logger.log(`[WhatsApp] Enviando lembrete para ${numeroWhatsapp}: ${mensagem}`);
    // Integração real aqui
  }
}