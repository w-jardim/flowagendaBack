import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async gerarMensagemConfirmacao(dados: {
    cliente: string;
    profissional: string;
    data: string;
    hora: string;
  }): Promise<string> {
    const systemPrompt =
      'Você é um assistente de agendamento humano e gentil. Sua tarefa é criar mensagens curtas para WhatsApp. Não use linguagem robótica. Use o nome do cliente e do profissional. Confirme data e hora. Use emojis moderadamente.';

    const userPrompt = `Gere uma mensagem de confirmação para o cliente ${dados.cliente}, profissional ${dados.profissional}, data ${dados.data}, hora ${dados.hora}.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || 'Mensagem não gerada.';
  }
}