import { DataSource } from 'typeorm';
import { Profissional } from './modules/profissional/profissional.entity';
import { Agendamento } from './modules/agendamento/agendamento.entity';
import { FrontendLog } from './modules/frontend-logs/frontend-log.entity';
import { HistoricoStatusProfissional } from './modules/admin/historico-status.entity';
import { Cliente } from './modules/cliente/cliente.entity';
import { Servico } from './modules/servico/servico.entity';
import { ConfiguracaoAgenda } from './modules/profissional/configuracao-agenda.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'flowagenda',
  entities: [Profissional, Agendamento, FrontendLog, HistoricoStatusProfissional, Cliente, Servico, ConfiguracaoAgenda],
  migrations: [__dirname + '/migrations/*.ts'],
});

export default AppDataSource;
