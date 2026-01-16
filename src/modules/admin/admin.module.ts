import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { Profissional } from '../profissional/profissional.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './admin.service';
import { Agendamento } from '../agendamento/agendamento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profissional, Agendamento]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
