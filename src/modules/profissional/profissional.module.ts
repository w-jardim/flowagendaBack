import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfissionalController } from './profissional.controller';
import { ProfissionalService } from './profissional.service';
import { Profissional } from './profissional.entity';
import { ConfiguracaoAgenda } from './configuracao-agenda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profissional, ConfiguracaoAgenda])],
  controllers: [ProfissionalController],
  providers: [ProfissionalService],
  exports: [ProfissionalService],
})
export class ProfissionalModule {}