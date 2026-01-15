import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agendamento } from './agendamento.entity';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { Servico } from '../servico/servico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agendamento, Servico])],
  providers: [AgendamentoService],
  controllers: [AgendamentoController],
})
export class AgendamentoModule {}
