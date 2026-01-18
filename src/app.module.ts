import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ServicoModule } from './modules/servico/servico.module';

// Módulos de Funcionalidades
import { AuthModule } from './modules/auth/auth.module';

// Entities (Importante para o forFeature global se necessário)
import { Profissional } from './modules/profissional/profissional.entity';
import { Cliente } from './modules/cliente/cliente.entity';
import { Servico } from './modules/servico/servico.entity';
import { Agendamento } from './modules/agendamento/agendamento.entity';
import { ConfiguracaoAgenda } from './modules/profissional/configuracao-agenda.entity';

import { ProfissionalModule } from './modules/profissional/profissional.module';
import { AgendamentoModule } from './modules/agendamento/agendamento.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';  // Importar o módulo
import { AiModule } from './modules/ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { FrontendLogsModule } from './modules/frontend-logs/frontend-logs.module';

@Module({
  imports: [
    // Configuração de Variáveis de Ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configuração do Banco de Dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Registro das Entities para uso global (opcional, mas ajuda)
    TypeOrmModule.forFeature([
      Profissional,
      Cliente,
      Servico,
      Agendamento,
      ConfiguracaoAgenda,
    ]),

    // Módulos da Aplicação
    AuthModule,
    ServicoModule,
    ProfissionalModule,
    AgendamentoModule,
    ClienteModule,
    WhatsappModule,  // Registrar o módulo aqui
    AiModule,
    AdminModule,
    FrontendLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}