import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agendamento } from './agendamento.entity';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { Servico } from '../servico/servico.entity';
import { ConfiguracaoAgenda } from '../profissional/configuracao-agenda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agendamento, Servico, ConfiguracaoAgenda])],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}