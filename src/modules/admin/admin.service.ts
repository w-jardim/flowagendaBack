import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Profissional } from '../profissional/profissional.entity';
import { Agendamento } from '../agendamento/agendamento.entity';
import { HistoricoStatusProfissional } from './historico-status.entity';
import { FrontendLog } from '../frontend-logs/frontend-log.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectRepository(Profissional)
    private readonly profRepo: Repository<Profissional>,
    @InjectRepository(Agendamento)
    private readonly agRepo: Repository<Agendamento>,
    @InjectRepository(HistoricoStatusProfissional)
    private readonly histRepo: Repository<HistoricoStatusProfissional>,
  ) {}

  async findAll(page = 1, limit = 20) {
    return this.findAllWithFilters({}, page, limit);
  }

  async findAllWithFilters(filters: { name?: string; status?: string }, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const qb = this.profRepo.createQueryBuilder('p')
      .leftJoin('agendamentos', 'a', 'a.profissional_id = p.id')
      .select([
        'p.id as id',
        'p.nome as nome',
        'p.email as email',
        'p.criado_em as criado_em',
        'p.atualizado_em as atualizado_em',
        'p.role as role',
        'p.status as status',
        'p.data_expiracao_assinatura as data_expiracao_assinatura',
      ])
      .addSelect('COUNT(a.id)', 'total_agendamentos')
      .groupBy('p.id')
      .orderBy('p.criado_em', 'DESC');

    if (filters.name) {
      qb.andWhere('p.nome ILIKE :name', { name: `%${filters.name}%` });
    }
    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }

    qb.offset(offset).limit(limit);

    let rows;
    try {
      rows = await qb.getRawMany();
    } catch (err) {
      this.logger.error('Erro na query findAllWithFilters', err as any);
      throw err;
    }
    const totalQb = this.profRepo.createQueryBuilder('p').select('COUNT(p.id)', 'cnt');
    if (filters.name) totalQb.where('p.nome ILIKE :name', { name: `%${filters.name}%` });
    if (filters.status) totalQb.andWhere('p.status = :status', { status: filters.status });
    const totalRes: any = await totalQb.getRawOne();
    const total = Number(totalRes?.cnt ?? 0);

    return {
      data: rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        criado_em: r.criado_em,
        atualizado_em: r.atualizado_em,
        role: r.role,
        status: r.status,
        data_expiracao_assinatura: r.data_expiracao_assinatura,
        total_agendamentos: Number(r.total_agendamentos || 0),
      })),
      page,
      limit,
      total,
    };
  }

  async findById(id: string) {
    try {
      const row = await this.profRepo.createQueryBuilder('p')
        .leftJoin('agendamentos', 'a', 'a.profissional_id = p.id')
        .select([
          'p.id as id',
          'p.nome as nome',
          'p.email as email',
          'p.criado_em as criado_em',
          'p.atualizado_em as atualizado_em',
          'p.role as role',
          'p.status as status',
        ])
        .addSelect('COUNT(a.id)', 'total_agendamentos')
        .where('p.id = :id', { id })
        .groupBy('p.id')
        .getRawOne();

      if (!row) return null;

      return {
        id: row.id,
        nome: row.nome,
        email: row.email,
        criado_em: row.criado_em,
        atualizado_em: row.atualizado_em,
        role: row.role,
        status: row.status,
        total_agendamentos: Number(row.total_agendamentos || 0),
      };
    } catch (err) {
      this.logger.error(`Erro findById ${id}`, err as any);
      throw err;
    }
  }

  async updateSubscription(id: string, days?: number, expiresAt?: string) {
    try {
      const prof = await this.profRepo.findOne({ where: { id } });
      if (!prof) return null;

      const now = new Date();
      if (expiresAt) {
        prof.data_expiracao_assinatura = new Date(expiresAt);
      } else if (typeof days === 'number') {
        const base = prof.data_expiracao_assinatura ?? now;
        prof.data_expiracao_assinatura = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      }

      await this.profRepo.save(prof);
      return { id: prof.id, data_expiracao_assinatura: prof.data_expiracao_assinatura };
    } catch (err) {
      this.logger.error(`Erro updateSubscription ${id}`, err as any);
      throw err;
    }
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    try {
      const prof = await this.profRepo.findOne({ where: { id } });
      if (!prof) return null;
      const previous = prof.status;
      prof.status = status;
      await this.profRepo.save(prof);

      // save history
      try {
        await this.histRepo.save({ profissional_id: prof.id, status_anterior: previous, status_novo: status });
      } catch (err) {
        this.logger.warn('Falha ao salvar historico de status: ' + (err as any).message);
      }

      return { id: prof.id, status: prof.status };
    } catch (err) {
      this.logger.error(`Erro updateStatus ${id}`, err as any);
      throw err;
    }
  }

  async getStats() {
    try {
      // Count professionals by status
      const total = await this.profRepo.count();
      const byStatusRaw = await this.profRepo
        .createQueryBuilder('p')
        .select('p.status', 'status')
        .addSelect('COUNT(p.id)', 'count')
        .groupBy('p.status')
        .getRawMany();

      const byStatus: Record<string, number> = {};
      byStatusRaw.forEach((r) => { byStatus[r.status] = Number(r.count); });

      // Total appointments
      const totalAgendamentos = await this.agRepo.count();

      // New professionals in last 30 days
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const novosQ = await this.profRepo.createQueryBuilder('p')
        .where('p.criado_em >= :since', { since: since.toISOString() })
        .getCount();

      return {
        totalProfissionais: total,
        byStatus,
        totalAgendamentos,
        novosUltimos30Dias: novosQ,
      };
    } catch (err) {
      this.logger.error('Erro getStats admin', err as any);
      throw err;
    }
  }

  // Metrics: growth, engagement, financial
  async getMetricsGrowth(granularity: 'day' | 'month' = 'month', since?: string) {
    const periodFormat = granularity === 'day' ? "YYYY-MM-DD" : "YYYY-MM";
    const sinceDate = since ? new Date(since) : (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; })();

    const raw = await this.profRepo.createQueryBuilder('p')
      .select(`to_char(p.criado_em, '${periodFormat}')`, 'period')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.criado_em >= :since', { since: sinceDate.toISOString() })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    // churn: count from historico_status_profissional where status_novo = BLOCKED
    const churnSince = new Date();
    churnSince.setDate(churnSince.getDate() - 30);
    const churnRaw: any = await this.histRepo.createQueryBuilder('h')
      .select('COUNT(h.id)', 'count')
      .where('h.status_novo = :blocked', { blocked: 'BLOCKED' })
      .andWhere('h.data_alteracao >= :since', { since: churnSince.toISOString() })
      .getRawOne();
    const churn = Number(churnRaw?.count ?? 0);

    return {
      series: raw.map(r => ({ period: r.period, count: Number(r.count) })),
      churnLast30Days: churn,
    };
  }

  async getMetricsEngagement() {
    // total agendamentos
    const totalAgendamentosRaw: any = await this.agRepo.createQueryBuilder('a')
      .select('COUNT(a.id)', 'count')
      .getRawOne();
    const totalAgendamentos = Number(totalAgendamentosRaw?.count ?? 0);

    // top 10 profissionais by agendamentos
    const top = await this.agRepo.createQueryBuilder('a')
      .select('a.profissional_id', 'profissional_id')
      .addSelect('COUNT(a.id)', 'count')
      .innerJoin('profissionais', 'p', 'p.id = a.profissional_id')
      .addSelect('p.nome', 'nome')
      .groupBy('a.profissional_id, p.nome')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // average per active professional
    const activeCount = await this.profRepo.createQueryBuilder('p')
      .where('p.status = :active', { active: 'ACTIVE' })
      .getCount();
    const avgPerActive = activeCount > 0 ? totalAgendamentos / activeCount : 0;

    return {
      totalAgendamentos,
      topProfissionais: top.map(t => ({ profissional_id: t.profissional_id, nome: t.nome, count: Number(t.count) })),
      avgAgendamentosPerActiveProfessional: Number(avgPerActive.toFixed(2)),
    };
  }

  async getMetricsFinancial() {
    // MRR: sum plano_valor of active professionals
    const mrrRaw: any = await this.profRepo.createQueryBuilder('p')
      .select('SUM(p.plano_valor)', 'mrr')
      .where('p.status = :active', { active: 'ACTIVE' })
      .andWhere('p.plano_valor IS NOT NULL')
      .getRawOne();
    const mrr = Number(mrrRaw?.mrr ?? 0);

    // renewals next 30 days based on data_proximo_pagamento
    const now = new Date();
    const next = new Date();
    next.setDate(next.getDate() + 30);
    const renewalsQ = await this.profRepo.createQueryBuilder('p')
      .where('p.status = :active', { active: 'ACTIVE' })
      .andWhere('p.data_proximo_pagamento BETWEEN :now AND :next', { now: now.toISOString(), next: next.toISOString() })
      .getMany();

    return {
      mrr,
      renewalsCount: renewalsQ.length,
      renewals: renewalsQ.map(r => ({ id: r.id, nome: r.nome, data_proximo_pagamento: r.data_proximo_pagamento, plano_valor: r.plano_valor })),
    };
  }

  async getMetricsTechnical() {
    // count of errors by status code in last 24h using frontend_logs.metadata.statusCode if available
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const qb = this.profRepo.manager.createQueryBuilder()
      .select("COALESCE((metadata->>'status')::text, (metadata->>'statusCode')::text, '500')", 'status')
      .addSelect('COUNT(*)', 'count')
      .from(FrontendLog, 'f')
      .where('f.created_at >= :since', { since: since.toISOString() })
      .groupBy('status')
      .orderBy('count', 'DESC');

    const rows: any[] = await qb.getRawMany();
    const result: Record<string, number> = {};
    rows.forEach(r => { result[r.status] = Number(r.count); });
    return result;
  }

  async getTopProfissionais(sinceDays?: number) {
    const qb = this.agRepo.createQueryBuilder('a')
      .select('a.profissional_id', 'profissional_id')
      .addSelect('COUNT(a.id)', 'agendamentos')
      .innerJoin('profissionais', 'p', 'p.id = a.profissional_id')
      .addSelect('p.nome', 'profissional_nome')
      .groupBy('a.profissional_id, p.nome')
      .orderBy('agendamentos', 'DESC')
      .limit(10);

    if (sinceDays && Number.isFinite(sinceDays)) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - Number(sinceDays));
      qb.where('a.data_inicio >= :since', { since: sinceDate.toISOString() });
    }

    const rows = await qb.getRawMany();
    return rows.map(r => ({
      profissional_id: r.profissional_id,
      profissional_nome: r.profissional_nome,
      agendamentos: Number(r.agendamentos),
    }));
  }
}
