import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Profissional } from '../profissional/profissional.entity';
import { Agendamento } from '../agendamento/agendamento.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Profissional)
    private readonly profRepo: Repository<Profissional>,
    @InjectRepository(Agendamento)
    private readonly agRepo: Repository<Agendamento>,
  ) {}

  async findAll(page = 1, limit = 20) {
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
      ])
      .addSelect('COUNT(a.id)', 'total_agendamentos')
      .groupBy('p.id')
      .orderBy('p.criado_em', 'DESC')
      .offset(offset)
      .limit(limit);

    const rows = await qb.getRawMany();

    // Total count for pagination
    const total = await this.profRepo.count();

    return {
      data: rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        criado_em: r.criado_em,
        atualizado_em: r.atualizado_em,
        role: r.role,
        status: r.status,
        total_agendamentos: Number(r.total_agendamentos || 0),
      })),
      page,
      limit,
      total,
    };
  }

  async findById(id: string) {
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
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
    const prof = await this.profRepo.findOne({ where: { id } });
    if (!prof) return null;
    prof.status = status;
    await this.profRepo.save(prof);
    return { id: prof.id, status: prof.status };
  }

  async getStats() {
    const totalProfissionais = await this.profRepo.count();
    const totalAdmins = await this.profRepo.count({ where: { role: 'ADMIN' } });
    const blocked = await this.profRepo.count({ where: { status: 'BLOCKED' } });
    return { totalProfissionais, totalAdmins, blocked };
  }
}
