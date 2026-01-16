require('dotenv').config();

import { DataSource } from 'typeorm';
import { Profissional } from './modules/profissional/profissional.entity';
import { Cliente } from './modules/cliente/cliente.entity';
import { Servico } from './modules/servico/servico.entity';
import { Agendamento } from './modules/agendamento/agendamento.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'flowagenda',
    entities: [Profissional, Cliente, Servico, Agendamento],
    synchronize: false,
  });

  await dataSource.initialize();

  // Create profissional
  const hashedPassword = await bcrypt.hash('password123', 10);
  const profissional = dataSource.getRepository(Profissional).create({
    nome: 'Dr. Silva',
    email: 'dr.silva@example.com',
    senhaHash: hashedPassword,
  });
  await dataSource.getRepository(Profissional).save(profissional);

  // Create test user for frontend testing
  const testPassword = await bcrypt.hash('senha123', 10);
  const testUser = dataSource.getRepository(Profissional).create({
    nome: 'Wallace',
    email: 'wallace@flowagenda.com',
    senhaHash: testPassword,
    role: 'ADMIN',
  });
  await dataSource.getRepository(Profissional).save(testUser);

  // Create cliente
  const cliente = dataSource.getRepository(Cliente).create({
    nome: 'João Silva',
    whatsapp: '123456789',
    profissional_id: profissional.id,
  });
  await dataSource.getRepository(Cliente).save(cliente);

  // Create servicos
  const servico1 = dataSource.getRepository(Servico).create({
    nome: 'Consulta',
    duracao_minutos: 60,
    profissional_id: profissional.id,
  });
  await dataSource.getRepository(Servico).save(servico1);

  const servico2 = dataSource.getRepository(Servico).create({
    nome: 'Retorno',
    duracao_minutos: 30,
    profissional_id: profissional.id,
  });
  await dataSource.getRepository(Servico).save(servico2);

  // Create agendamentos for today
  const today = new Date();
  today.setHours(9, 0, 0, 0); // 9:00
  const agendamento1 = dataSource.getRepository(Agendamento).create({
    profissional_id: profissional.id,
    cliente_id: cliente.id,
    servico_id: servico1.id,
    data_inicio: today,
    data_fim: new Date(today.getTime() + 60 * 60 * 1000), // +1h
    status: 'confirmado',
  });
  await dataSource.getRepository(Agendamento).save(agendamento1);

  today.setHours(10, 30, 0, 0); // 10:30
  const agendamento2 = dataSource.getRepository(Agendamento).create({
    profissional_id: profissional.id,
    cliente_id: cliente.id,
    servico_id: servico2.id,
    data_inicio: today,
    data_fim: new Date(today.getTime() + 30 * 60 * 1000), // +30min
    status: 'confirmado',
  });
  await dataSource.getRepository(Agendamento).save(agendamento2);

  today.setHours(14, 0, 0, 0); // 14:00
  const agendamento3 = dataSource.getRepository(Agendamento).create({
    profissional_id: profissional.id,
    cliente_id: cliente.id,
    servico_id: servico1.id,
    data_inicio: today,
    data_fim: new Date(today.getTime() + 60 * 60 * 1000),
    status: 'confirmado',
  });
  await dataSource.getRepository(Agendamento).save(agendamento3);

  console.log('Seed completed');
  await dataSource.destroy();
}

seed().catch(console.error);