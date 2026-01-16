import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Servico } from './servico.entity';
import { ServicoDto } from './dto/servico.dto';

@Injectable()
export class ServicoService {
  constructor(
    @InjectRepository(Servico)
    private readonly servicoRepo: Repository<Servico>,
  ) {}

  async criar(profissionalId: string, dto: ServicoDto): Promise<Servico> {
    // --- INÍCIO DOS LOGS DE DIAGNÓSTICO (REMOVER APÓS TESTE) ---
    console.log('--- DIAGNÓSTICO: CRIANDO SERVIÇO ---');
    console.log('ID do Profissional vindo do Token:', profissionalId);
    console.log('Dados do DTO recebidos:', JSON.stringify(dto, null, 2));
    // --- FIM DOS LOGS DE DIAGNÓSTICO ---

    // Mapear explicitamente os campos do DTO para a entidade
    const mapped: DeepPartial<Servico> = {
      nome: dto.nome,
      // aceita tanto 'duracao' (frontend) quanto 'duracao_minutos' (caso venha assim)
      duracao_minutos: (dto as any).duracao ?? (dto as any).duracao_minutos ?? 0,
      intervalo_minutos: (dto as any).intervalo ?? (dto as any).intervalo_minutos ?? 0,
      // converte string para number se necessário; não atribui null para evitar erro de tipagem
      preco:
        (dto as any).preco !== undefined && (dto as any).preco !== null
          ? typeof (dto as any).preco === 'string'
            ? parseFloat((dto as any).preco)
            : (dto as any).preco
          : undefined,
      ativo: (dto as any).ativo ?? true,
      profissional: { id: profissionalId },
    };

    const novoServico = this.servicoRepo.create(mapped);

    try {
      const salvo = await this.servicoRepo.save(novoServico as any);
      console.log('SUCESSO: Serviço salvo no banco com ID:', salvo.id); // REMOVER APÓS TESTE
      return salvo;
    } catch (err) {
      console.error('ERRO CRÍTICO NO BANCO AO SALVAR SERVIÇO:', err); // REMOVER APÓS TESTE
      throw new InternalServerErrorException('Erro interno ao criar serviço');
    }
  }

  async listarPorProfissional(profissionalId: string): Promise<Servico[]> {
    return await this.servicoRepo.find({
      where: { profissional: { id: profissionalId }, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async atualizar(id: string, profissionalId: string, dto: Partial<ServicoDto>): Promise<Servico> {
    const servico = await this.buscarEValidarDono(id, profissionalId);

    const body: any = dto as any;

    if (body.nome !== undefined) servico.nome = body.nome;
    if (body.duracao !== undefined) servico.duracao_minutos = body.duracao;
    if (body.duracao_minutos !== undefined) servico.duracao_minutos = body.duracao_minutos;
    if (body.intervalo !== undefined) servico.intervalo_minutos = body.intervalo;
    if (body.intervalo_minutos !== undefined) servico.intervalo_minutos = body.intervalo_minutos;
    if (body.preco !== undefined && body.preco !== null) {
      servico.preco = typeof body.preco === 'string' ? parseFloat(body.preco) : body.preco;
    }
    if (body.ativo !== undefined) servico.ativo = body.ativo;

    try {
      return await this.servicoRepo.save(servico as any);
    } catch (err) {
      console.error('Erro atualizando serviço:', err);
      throw new InternalServerErrorException('Erro interno ao atualizar serviço');
    }
  }

  async remover(id: string, profissionalId: string): Promise<void> {
    const servico = await this.buscarEValidarDono(id, profissionalId);
    servico.ativo = false;
    await this.servicoRepo.save(servico as any);
  }

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