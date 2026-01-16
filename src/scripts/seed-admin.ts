require('dotenv').config();

import { DataSource } from 'typeorm';
import { Profissional } from '../modules/profissional/profissional.entity';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'flowagenda',
    entities: [Profissional],
    synchronize: false,
  });

  await dataSource.initialize();

  const repo = dataSource.getRepository(Profissional);

  const email = process.env.ADMIN_EMAIL || 'admin@flowagenda.com';
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    await dataSource.destroy();
    return;
  }

  const senhaHash = await bcrypt.hash(rawPassword, 10);
  const admin = repo.create({
    nome: 'Admin FlowAgenda',
    email,
    senhaHash,
    role: 'ADMIN',
    status: 'ACTIVE',
  } as any);

  await repo.save(admin);
  console.log('Admin created:', email);
  await dataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
