import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, And } from 'typeorm';
import { Agendamento } from './agendamento.entity';
import { CriarAgendamentoDto } from './dto/criar-agendamento.dto';
import { Servico } from '../servico/servico.entity';

@Injectable()
export class AgendamentoService {
  constructor(
    @InjectRepository(Agendamento)
    private readonly repo: Repository<Agendamento>,
    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,
  ) {}

  async criar(profissionalId: string, dto: CriarAgendamentoDto) {
    const inicio = new Date(dto.data_inicio);
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
        status: 'confirmado',
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

    return await this.repo.save(novo);
  }

  async listarPorProfissional(profissionalId: string) {
    return await this.repo.find({
      where: { profissional_id: profissionalId },
      relations: ['cliente', 'servico'],
      order: { data_inicio: 'ASC' },
    });
  }
}