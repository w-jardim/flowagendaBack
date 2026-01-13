import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servico } from './servico.entity';
import { ServicoDto } from './dto/servico.dto';

@Injectable()
export class ServicoService {
  constructor(
    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,
  ) {}

  async criar(profissionalId: string, dto: ServicoDto): Promise<Servico> {
    const novoServico = this.servicoRepo.create({
      ...dto,
      profissional: { id: profissionalId }, // Vincula ao profissional logado
    });
    return await this.servicoRepo.save(novoServico);
  }

  async listarPorProfissional(profissionalId: string): Promise<Servico[]> {
    return await this.servicoRepo.find({
      where: { profissional: { id: profissionalId }, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async atualizar(id: string, profissionalId: string, dto: Partial<ServicoDto>): Promise<Servico> {
    const servico = await this.buscarEValidarDono(id, profissionalId);
    Object.assign(servico, dto);
    return await this.servicoRepo.save(servico);
  }

  async remover(id: string, profissionalId: string): Promise<void> {
    const servico = await this.buscarEValidarDono(id, profissionalId);
    // Em vez de deletar fisicamente, podemos apenas desativar
    servico.ativo = false;
    await this.servicoRepo.save(servico);
  }

  // Método auxiliar de segurança
  private async buscarEValidarDono(id: string, profissionalId: string): Promise<Servico> {
    const servico = await this.servicoRepo.findOne({
      where: { id },
      relations: ['profissional'],
    });

    if (!servico) {
      throw new NotFoundException('Serviço não encontrado');
    }

    if (servico.profissional.id !== profissionalId) {
      throw new ForbiddenException('Você não tem permissão para alterar este serviço');
    }

    return servico;
  }
}