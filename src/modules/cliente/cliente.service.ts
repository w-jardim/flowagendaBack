import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CriarClienteDto } from './dto/criar-cliente.dto';

@Injectable()
export class ClienteService {
  private logger = new Logger('ClienteService');

  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  async criar(dto: CriarClienteDto, profissionalId: string): Promise<Cliente> {
    try {
      this.logger.log(`[CLIENTE-SERVICE] Iniciando criação de cliente para profissional: ${profissionalId}`);
      this.logger.log(`[CLIENTE-SERVICE] Dados: nome=${dto.nome}, whatsapp=${dto.whatsapp}, email=${dto.email}, cpf=${dto.cpf}`);
      
      // Verificar duplicatas por profissional
      if (dto.whatsapp) {
        const existingWhatsapp = await this.clienteRepo.findOne({
          where: { whatsapp: dto.whatsapp, profissional_id: profissionalId },
        });
        if (existingWhatsapp) {
          throw new ConflictException('Já existe um cliente com este WhatsApp para este profissional');
        }
      }
      if (dto.cpf) {
        const existingCpf = await this.clienteRepo.findOne({
          where: { cpf: dto.cpf, profissional_id: profissionalId },
        });
        if (existingCpf) {
          throw new ConflictException('Já existe um cliente com este CPF para este profissional');
        }
      }
      if (dto.email) {
        const existingEmail = await this.clienteRepo.findOne({
          where: { email: dto.email, profissional_id: profissionalId },
        });
        if (existingEmail) {
          throw new ConflictException('Já existe um cliente com este email para este profissional');
        }
      }

      const cliente = this.clienteRepo.create({ ...dto, profissional_id: profissionalId });
      this.logger.log(`[CLIENTE-SERVICE] Cliente object criado, salvando no banco...`);
      
      const savedCliente = await this.clienteRepo.save(cliente);
      this.logger.log(`[CLIENTE-SERVICE] ✅ Cliente salvo com sucesso: ${savedCliente.id}`);
      
      return savedCliente;
    } catch (error) {
      this.logger.error(`[CLIENTE-SERVICE] ❌ Erro ao criar cliente: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(profissionalId: string): Promise<Cliente[]> {
    return this.clienteRepo.find({
      where: { profissional_id: profissionalId },
      order: { nome: 'ASC' },
    });
  }

  toPublic(cliente: Cliente) {
    return {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.whatsapp ?? null,
      email: cliente.email ?? null,
      cpf: cliente.cpf ?? null,
      endereco: cliente.endereco ?? null,
    };
  }

  async findAllPublic(profissionalId: string) {
    const clientes = await this.findAll(profissionalId);
    return clientes.map((c) => this.toPublic(c));
  }

  async findOne(id: string, profissionalId: string): Promise<Cliente> {
    const cliente = await this.clienteRepo.findOne({
      where: { id, profissional_id: profissionalId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }
    const clienteLog = {
      id: cliente.id,
      nome: cliente.nome,
      whatsapp: cliente.whatsapp,
      email: cliente.email,
      cpf: cliente.cpf,
      endereco: cliente.endereco,
    };
    this.logger.log(`[CLIENTE-SERVICE] Cliente retornado: ${JSON.stringify(clienteLog)}`);
    return cliente;
  }

  async findOnePublic(id: string, profissionalId: string) {
    const cliente = await this.findOne(id, profissionalId);
    return this.toPublic(cliente);
  }

  async atualizar(id: string, dto: Partial<CriarClienteDto>, profissionalId: string): Promise<Cliente> {
    const cliente = await this.findOne(id, profissionalId);

    // Verificar duplicatas se campos únicos estão sendo alterados
    if (dto.whatsapp && dto.whatsapp !== cliente.whatsapp) {
      const existingWhatsapp = await this.clienteRepo.findOne({
        where: { whatsapp: dto.whatsapp, profissional_id: profissionalId },
      });
      if (existingWhatsapp) {
        throw new ConflictException('Já existe um cliente com este WhatsApp para este profissional');
      }
    }
    if (dto.cpf && dto.cpf !== cliente.cpf) {
      const existingCpf = await this.clienteRepo.findOne({
        where: { cpf: dto.cpf, profissional_id: profissionalId },
      });
      if (existingCpf) {
        throw new ConflictException('Já existe um cliente com este CPF para este profissional');
      }
    }
    if (dto.email && dto.email !== cliente.email) {
      const existingEmail = await this.clienteRepo.findOne({
        where: { email: dto.email, profissional_id: profissionalId },
      });
      if (existingEmail) {
        throw new ConflictException('Já existe um cliente com este email para este profissional');
      }
    }

    Object.assign(cliente, dto);
    return this.clienteRepo.save(cliente);
  }

  async deletar(id: string, profissionalId: string): Promise<void> {
    const cliente = await this.findOne(id, profissionalId);
    await this.clienteRepo.remove(cliente);
  }
}