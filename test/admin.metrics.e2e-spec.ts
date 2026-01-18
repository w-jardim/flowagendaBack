import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import AppDataSource from '../src/data-source';
import { ensureMetricsSchema } from './helpers/ensure-schema';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Profissional } from '../src/modules/profissional/profissional.entity';

jest.setTimeout(30000);

describe('Admin Metrics E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let server: any;

  beforeAll(async () => {
    // ensure migrations applied before app start
    await ensureMetricsSchema();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    server = app.getHttpServer();
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create professionals, block some and reflect metrics', async () => {
    const repo = dataSource.getRepository(Profissional);

    // cleanup: delete dependent tables in order to avoid FK errors
    const agRepo = dataSource.getRepository('Agendamento');
    const histRepo = dataSource.getRepository('HistoricoStatusProfissional');
    const logRepo = dataSource.getRepository('FrontendLog');
    try { await agRepo.createQueryBuilder().delete().execute(); } catch (e) {}
    try { await histRepo.createQueryBuilder().delete().execute(); } catch (e) {}
    try { await logRepo.createQueryBuilder().delete().execute(); } catch (e) {}
    try { await repo.createQueryBuilder().delete().execute(); } catch (e) {}

    // create 5 professionals with varying created_at
    const base = new Date();
    const profs = [];
    for (let i = 0; i < 5; i++) {
      const p = repo.create({
        nome: `Test Prof ${i}`,
        email: `test${i}@example.com`,
        senhaHash: 'x',
        role: 'PROFISSIONAL',
        status: 'ACTIVE',
        criado_em: new Date(base.getTime() - i * 24 * 3600 * 1000),
        plano_valor: 100.00,
        data_proximo_pagamento: new Date(base.getTime() + (30 - i) * 24 * 3600 * 1000),
      } as any);
      profs.push(await repo.save(p));
    }

    // block 2 professionals via admin endpoint
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@flowagenda.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // ensure admin exists in DB
    const profRepo = dataSource.getRepository(Profissional);
    const existingAdmin = await profRepo.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const bcrypt = require('bcrypt');
      const senhaHash = await bcrypt.hash(adminPass, 10);
      await profRepo.save(profRepo.create({ nome: 'Admin Test', email: adminEmail, senhaHash, role: 'ADMIN', status: 'ACTIVE' } as any));
    }
    // login admin
    const login = await request(server).post('/auth/login').send({ email: adminEmail, senha: adminPass });
    const token = login.body?.access_token || login.body?.token || login.body?.token;
    expect(token).toBeDefined();

    const toBlock = profs.slice(0,2);
    for (const p of toBlock) {
      await request(server)
        .patch(`/admin/profissionais/${p.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'BLOCKED' })
        .expect(200);
    }

    // check growth
    const growth = await request(server)
      .get('/admin/metrics/growth')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(growth.body.series)).toBeTruthy();
    // churn should be at least 2 (blocked)
    expect(growth.body.churnLast30Days).toBeGreaterThanOrEqual(2);

    // engagement
    const engagement = await request(server)
      .get('/admin/metrics/engagement')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(typeof engagement.body.totalAgendamentos).toBe('number');

    // financial
    const financial = await request(server)
      .get('/admin/metrics/financial')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(typeof financial.body.mrr).toBe('number');
    expect(financial.body.renewalsCount).toBeDefined();

    // technical
    const tech = await request(server)
      .get('/admin/metrics/technical')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(typeof tech.body === 'object').toBeTruthy();
  });
});
