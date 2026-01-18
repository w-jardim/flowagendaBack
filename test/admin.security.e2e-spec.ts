import { Test, TestingModule } from '@nestjs/testing';
import AppDataSource from '../src/data-source';
import { ensureMetricsSchema } from './helpers/ensure-schema';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { Profissional } from '../src/modules/profissional/profissional.entity';
import * as bcrypt from 'bcrypt';

describe('Admin security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await ensureMetricsSchema();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    try {
      const ds = app.get('DataSource');
      if (ds && ds.isInitialized) await ds.destroy();
    } catch (err) {}
    await app.close();
  });

  it('should prevent login for BLOCKED users', async () => {
    const dataSource = app.get(DataSource) as DataSource;
    const repo = dataSource.getRepository(Profissional);

    const email = 'blocked_user@flowagenda.com';
    const rawPassword = 'blocked123';

    // create or replace blocked user
    const existing = await repo.findOne({ where: { email } });
    if (!existing) {
      const senhaHash = await bcrypt.hash(rawPassword, 10);
      const blocked = repo.create({
        nome: 'Blocked User',
        email,
        senhaHash,
        role: 'PROFISSIONAL',
        status: 'BLOCKED',
      } as any);
      await repo.save(blocked);
    } else {
      existing.status = 'BLOCKED';
      await repo.save(existing);
    }

    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, senha: rawPassword });
    expect(res.status).toBe(401);
  });

  it('should deny access to admin endpoints for non-admin users', async () => {
    const dataSource = app.get(DataSource) as DataSource;
    const repo = dataSource.getRepository(Profissional);

    const email = 'normal_user@flowagenda.com';
    const rawPassword = 'normal123';

    let user = await repo.findOne({ where: { email } });
    if (!user) {
      const senhaHash = await bcrypt.hash(rawPassword, 10);
      user = repo.create({
        nome: 'Normal User',
        email,
        senhaHash,
        role: 'PROFISSIONAL',
        status: 'ACTIVE',
      } as any);
      await repo.save(user);
    } else {
      user.role = 'PROFISSIONAL';
      user.status = 'ACTIVE';
      await repo.save(user);
    }

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, senha: rawPassword });
    expect(login.status).toBeLessThan(400);
    const token = login.body.access_token;

    const res = await request(app.getHttpServer()).get('/admin/profissionais').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
