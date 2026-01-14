import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agendamento } from './agendamento.entity';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { Servico } from '../servico/servico.entity';
import { ConfiguracaoAgenda } from '../profissional/configuracao-agenda.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module'; // <-- ADICIONE ESTA LINHA

@Module({
  imports: [
    TypeOrmModule.forFeature([Agendamento, Servico, ConfiguracaoAgenda]),
    WhatsappModule, 
  ],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}