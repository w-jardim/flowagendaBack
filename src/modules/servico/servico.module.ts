import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicoService } from './servico.service';
import { ServicoController } from './servico.controller';
import { Servico } from './servico.entity';
import { Profissional } from '../profissional/profissional.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Servico, Profissional]),
    AuthModule, // Importante para usar o JwtAuthGuard
  ],
  controllers: [ServicoController],
  providers: [ServicoService],
})
export class ServicoModule {}