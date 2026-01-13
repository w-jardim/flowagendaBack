import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracaoAgenda } from './configuracao-agenda.entity';
import { ConfigAgendaDto } from './dto/config-agenda.dto';
import { Profissional } from './profissional.entity';

@Injectable()
export class ProfissionalService {
  constructor(
    @InjectRepository(Profissional)
    private readonly profissionalRepo: Repository<Profissional>,

    @InjectRepository(ConfiguracaoAgenda)
    private readonly configRepo: Repository<ConfiguracaoAgenda>,
  ) {}

  // Outros métodos...

  async salvarConfiguracao(profissionalId: string, dto: ConfigAgendaDto): Promise<ConfiguracaoAgenda> {
    let config = await this.configRepo.findOne({
      where: { profissional: { id: profissionalId } },
    });

    if (config) {
      Object.assign(config, dto);
    } else {
      config = this.configRepo.create({
        ...dto,
        profissional: { id: profissionalId },
      });
    }

    return this.configRepo.save(config);
  }
}