import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agendamento } from './agendamento.entity';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { Servico } from '../servico/servico.entity';
import { ConfiguracaoAgenda } from '../profissional/configuracao-agenda.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AgendamentoService {
  private readonly logger = new Logger(AgendamentoService.name);

  constructor(
    @InjectRepository(Agendamento)
    private readonly agendamentoRepo: Repository<Agendamento>,

    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,

    @InjectRepository(ConfiguracaoAgenda)
    private readonly configRepo: Repository<ConfiguracaoAgenda>,

    private readonly whatsappService: WhatsappService,
  ) {}

  // Helper: formata hora UTC de um Date para "HH:mm:ss"
  private timeStringUTC(d: Date): string {
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  // Helper: converte Date para dia curto em pt: seg, ter, qua, qui, sex, sab, dom
  private dayShort(d: Date): string {
    const map = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return map[d.getUTCDay()];
  }

  async criar(dto: CriarAgendamentoDto): Promise<Agendamento> {
    // Parse data_inicio
    const inicio = new Date(dto.data_inicio);
    if (isNaN(inicio.getTime())) throw new BadRequestException('data_inicio inválida');

    // Buscar serviço com profissional
    const servico = await this.servicoRepo.findOne({
      where: { id: dto.servico_id },
      relations: ['profissional'],
    });
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const profissionalId = servico.profissional.id;

    // Buscar configuração de agenda do profissional
    const config = await this.configRepo.findOne({
      where: { profissional: { id: profissionalId } },
    });

    if (!config) {
      throw new BadRequestException('Profissional não tem configuração de agenda definida');
    }

    // Validação de dia ativo
    const dia = this.dayShort(inicio);
    if (!config.dias_ativos || !Array.isArray(config.dias_ativos) || !config.dias_ativos.includes(dia)) {
      throw new BadRequestException('Profissional não atende neste dia');
    }

    // Cálculo data_fim = inicio + duracao
    const duracaoMin = Number(servico.duracao_minutos || 0);
    const intervaloMin = Number(servico.intervalo_minutos || 0);
    const fim = new Date(inicio.getTime() + duracaoMin * 60_000);

    // Verificar se dentro do horario_inicio/horario_fim
    const horaInicioReq = this.timeStringUTC(inicio);
    const horaFimReq = this.timeStringUTC(fim);

    // config.horario_inicio/fim devem estar no formato HH:mm:ss
    if (!config.horario_inicio || !config.horario_fim) {
      throw new BadRequestException('Configuracao de horário inválida');
    }

    if (horaInicioReq < config.horario_inicio || horaFimReq > config.horario_fim) {
      throw new BadRequestException('Agendamento fora da jornada de trabalho do profissional');
    }

    // Cálculo do fim com intervalo (novo_fim_com_intervalo)
    const fimComIntervalo = new Date(fim.getTime() + intervaloMin * 60_000);

    // Verificação de conflitos:
    // Busca agendamento existente onde:
    // novo_inicio < (existente.data_fim + existente_servico.intervalo_minutos)
    // AND novo_fim_com_intervalo > existente.data_inicio
    const conflict = await this.agendamentoRepo
      .createQueryBuilder('a')
      .leftJoin('a.servico', 's')
      .where('a.profissional = :profId', { profId: profissionalId })
      .andWhere('(:novoInicio < (a.data_fim + (s.intervalo_minutos * interval \'1 minute\')))', {
        novoInicio: inicio.toISOString(),
      })
      .andWhere('(:novoFim > a.data_inicio)', {
        novoFim: fimComIntervalo.toISOString(),
      })
      .getOne();

    if (conflict) {
      throw new ConflictException('Conflito de agendamento: horário ocupado ou intervalo insuficiente');
    }

    // Tudo OK: criar agendamento
    const ag = this.agendamentoRepo.create({
      servico: { id: servico.id },
      cliente: { id: dto.cliente_id },
      profissional: { id: profissionalId },
      data_inicio: inicio,
      data_fim: fim,
      observacoes: dto.observacoes,
      status: 'pendente',
    });

    const saved = await this.agendamentoRepo.save(ag);

    // Recarregar com relations para obter nome/whatsapp
    const savedWithRelations = await this.agendamentoRepo.findOne({
      where: { id: saved.id },
      relations: ['cliente', 'profissional', 'servico'],
    });

    // Disparo assíncrono da confirmação WhatsApp (não bloqueia/agendamento já persistido)
    if (savedWithRelations?.cliente?.whatsapp) {
      // fire-and-forget, log any error
      this.whatsappService
        .enviarConfirmacao(
          savedWithRelations.cliente.whatsapp,
          savedWithRelations.cliente.nome,
          savedWithRelations.profissional?.nome ?? 'Profissional',
          savedWithRelations.servico?.nome ?? 'Serviço',
          savedWithRelations.data_inicio,
        )
        .then(() => {
          this.logger.log(`[WhatsApp] Confirmacao enviada para ${savedWithRelations.cliente.whatsapp}`);
        })
        .catch((err) => {
          this.logger.error(`[WhatsApp] Erro ao enviar confirmacao para ${savedWithRelations.cliente.whatsapp}`, err);
        });
    } else {
      this.logger.warn(`[WhatsApp] Cliente sem número WhatsApp para agendamento ${saved.id}`);
    }

    return saved;
  }

  // Listar agenda do profissional por data (opcional)
  async listarMinhaAgenda(profissionalId: string, date?: string) {
    const qb = this.agendamentoRepo.createQueryBuilder('a').leftJoinAndSelect('a.servico', 's')
      .leftJoinAndSelect('a.cliente', 'c')
      .where('a.profissional = :profId', { profId: profissionalId });

    if (date) {
      // filtrar por dia (UTC)
      const dia = new Date(date);
      if (isNaN(dia.getTime())) throw new BadRequestException('data inválida');
      const start = new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 0, 0, 0));
      const end = new Date(start.getTime() + 24 * 60 * 60_000 - 1);
      qb.andWhere('a.data_inicio BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() });
    }

    qb.orderBy('a.data_inicio', 'ASC');

    return qb.getMany();
  }

  // Envia lembrete manual para um agendamento existente
  async enviarLembrete(agendamentoId: string): Promise<void> {
    const ag = await this.agendamentoRepo.findOne({
      where: { id: agendamentoId },
      relations: ['cliente', 'profissional', 'servico'],
    });
    if (!ag) throw new NotFoundException('Agendamento não encontrado');

    if (!ag.cliente?.whatsapp) {
      this.logger.warn(`[WhatsApp] Não há número WhatsApp para o cliente do agendamento ${ag.id}`);
      return;
    }

    const horaFormatada = ag.data_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Fire-and-forget
    this.whatsappService
      .enviarLembrete(ag.cliente.whatsapp, ag.cliente.nome, horaFormatada)
      .then(() => {
        this.logger.log(`[WhatsApp] Lembrete enviado para ${ag.cliente.whatsapp} (ag: ${ag.id})`);
      })
      .catch((err) => {
        this.logger.error(`[WhatsApp] Erro ao enviar lembrete para ${ag.cliente.whatsapp} (ag: ${ag.id})`, err);
      });
  }
}