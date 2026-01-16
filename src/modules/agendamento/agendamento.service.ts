import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, MoreThanOrEqual, Not, In } from 'typeorm';
import { Agendamento } from './agendamento.entity';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { Servico } from '../servico/servico.entity';
import { Profissional } from '../profissional/profissional.entity';
import { AiService } from '../ai/ai.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AgendamentoService {
  private logger = new Logger('AgendamentoService');
  constructor(
    @InjectRepository(Agendamento)
    private readonly repo: Repository<Agendamento>,
    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,
    @InjectRepository(Profissional)
    private readonly profRepo: Repository<Profissional>,
    private readonly aiService: AiService,
    private readonly whatsappService: WhatsappService,
  ) {}

  private parseAsUTC(dateStr: string): Date {
    return dateStr.includes('Z') ? new Date(dateStr) : new Date(dateStr + 'Z');
  }

  async criar(profissionalId: string, dto: CriarAgendamentoDto) {
    const inicio = this.parseAsUTC(dto.data_inicio);
    let fim = new Date(inicio);

    // 1. Buscar duração do serviço para calcular o fim
    if (dto.servico_id) {
      const servico = await this.servicoRepo.findOneBy({ id: dto.servico_id });
      if (!servico) throw new NotFoundException('Serviço não encontrado');
      fim.setMinutes(inicio.getMinutes() + servico.duracao_minutos);
    } else {
      fim.setMinutes(inicio.getMinutes() + 30); // Default 30min se não houver serviço
    }

    // 2. Verificar conflito de horário
    const conflito = await this.repo.findOne({
      where: {
        profissional_id: profissionalId,
        status: Not('Cancelado'),
        data_inicio: LessThan(fim),
        data_fim: MoreThan(inicio),
      },
    });

    if (conflito) {
      throw new ConflictException('Este horário já está ocupado.');
    }

    // 3. Salvar
    const novo = this.repo.create({
      ...dto,
      profissional_id: profissionalId,
      data_inicio: inicio,
      data_fim: fim,
    });

    const salvo = await this.repo.save(novo);

    // 4. Gerar mensagem de confirmação com IA
    const agendamentoCompleto = await this.repo.findOne({
      where: { id: salvo.id },
      relations: ['cliente', 'profissional'],
    });

    if (agendamentoCompleto) {
      const data = agendamentoCompleto.data_inicio.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
      });
      const hora = agendamentoCompleto.data_inicio.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });

      const mensagem = await this.aiService.gerarMensagemConfirmacao({
        cliente: agendamentoCompleto.cliente.nome,
        profissional: agendamentoCompleto.profissional.nome,
        data,
        hora,
      });

      console.log('--- MENSAGEM IA GERADA ---', mensagem);

      // Enviar mensagem via WhatsApp
      try {
        await this.whatsappService.enviarMensagem(agendamentoCompleto.cliente.whatsapp, mensagem);
        console.log('--- WHATSAPP ENVIADO PARA O CLIENTE ---');
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error.message);
        // Não falha o agendamento
      }
    }

    return salvo;
  }

  async listarPorProfissional(profissionalId: string, data?: string) {
    let where: any = { profissional_id: profissionalId };

    if (data) {
      const date = new Date(data + 'T00:00:00Z'); // Parse as UTC
      const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));

      where.data_inicio = MoreThan(startOfDay);
      where.data_fim = LessThan(endOfDay);
    } else {
      const now = new Date();
      where.data_inicio = MoreThanOrEqual(now);
      // Incluir agendamentos com status agendado ou confirmado (aceitar variações de capitalização)
      where.status = In(['confirmado', 'agendado', 'Confirmado', 'Agendado']);
      this.logger.log(`[AGENDA] Buscar próximos agendamentos para profissional=${profissionalId} a partir de ${now.toISOString()}`);
    }

    return await this.repo.find({
      where,
      relations: ['cliente', 'servico'],
      order: { data_inicio: 'ASC' },
    });
  }

  async atualizar(id: string, profissionalId: string, dto: any) {
    const agendamento = await this.buscarEValidarDono(id, profissionalId);

    if (dto.data_inicio) {
      agendamento.data_inicio = this.parseAsUTC(dto.data_inicio);
      // Recalcular data_fim se necessário
      if (dto.servico_id || agendamento.servico_id) {
        const servicoId = dto.servico_id || agendamento.servico_id;
        const servico = await this.servicoRepo.findOneBy({ id: servicoId });
        if (servico) {
          agendamento.data_fim = new Date(agendamento.data_inicio.getTime() + servico.duracao_minutos * 60 * 1000);
        }
      }

      // Verificar conflito de horário
      const conflito = await this.repo.findOne({
        where: {
          profissional_id: profissionalId,
          status: Not('Cancelado'),
          id: Not(id), // Excluir o próprio agendamento
          data_inicio: LessThan(agendamento.data_fim),
          data_fim: MoreThan(agendamento.data_inicio),
        },
      });

      if (conflito) {
        throw new ConflictException('Este horário já está ocupado.');
      }
    }

    if (dto.status) {
      agendamento.status = dto.status;
    }

    // Outros campos se necessário

    return await this.repo.save(agendamento);
  }

  async remover(id: string, profissionalId: string) {
    const agendamento = await this.buscarEValidarDono(id, profissionalId);
    await this.repo.remove(agendamento);
  }

  private async buscarEValidarDono(id: string, profissionalId: string) {
    const agendamento = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'servico'],
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (agendamento.profissional_id !== profissionalId) {
      throw new ForbiddenException('Você não tem permissão para alterar este agendamento');
    }

    return agendamento;
  }
}