import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { Profissional } from '../profissional/profissional.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './admin.service';
import { Agendamento } from '../agendamento/agendamento.entity';
import { HistoricoStatusProfissional } from './historico-status.entity';
import { FrontendLog } from '../frontend-logs/frontend-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profissional, Agendamento, HistoricoStatusProfissional, FrontendLog]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
