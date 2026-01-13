import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agendamento } from './agendamento.entity';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { Servico } from '../servico/servico.entity';
import { ConfiguracaoAgenda } from '../profissional/configuracao-agenda.entity';

@Injectable()
export class AgendamentoService {
  constructor(
    @InjectRepository(Agendamento)
    private readonly agendamentoRepo: Repository<Agendamento>,

    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,

    @InjectRepository(ConfiguracaoAgenda)
    private readonly configRepo: Repository<ConfiguracaoAgenda>,
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

    return this.agendamentoRepo.save(ag);
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
}