import { Test, TestingModule } from '@nestjs/testing';
import AppDataSource from '../src/data-source';
import { ensureMetricsSchema } from './helpers/ensure-schema';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { Profissional } from '../src/modules/profissional/profissional.entity';
import * as bcrypt from 'bcrypt';

describe('Admin (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await ensureMetricsSchema();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Seed admin dynamically in the same DB used by the app
    const dataSource = app.get(DataSource) as DataSource;
    const repo = dataSource.getRepository(Profissional);

    const email = process.env.ADMIN_EMAIL || 'admin@flowagenda.com';
    const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await repo.findOne({ where: { email } });
    if (!existing) {
      const senhaHash = await bcrypt.hash(rawPassword, 10);
      const admin = repo.create({
        nome: 'Admin FlowAgenda',
        email,
        senhaHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      } as any);
      await repo.save(admin);
    } else if (existing.role !== 'ADMIN') {
      existing.role = 'ADMIN';
      existing.status = 'ACTIVE';
      await repo.save(existing);
    }
  });

  afterAll(async () => {
    try {
      const ds = app.get('DataSource');
      if (ds && ds.isInitialized) await ds.destroy();
    } catch (err) {}
    await app.close();
  });

  it('login returns token with role ADMIN (seed admin created)', async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@flowagenda.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, senha: password });
    expect(res.status).toBeLessThan(400);
    expect(res.body).toBeDefined();
    expect(res.body.access_token).toBeDefined();

    const decoded: any = jwt.decode(res.body.access_token);
    expect(decoded).toBeDefined();
    expect(decoded.role).toBe('ADMIN');
  });

  it('admin can access /admin/profissionais', async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@flowagenda.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, senha: password });
    const token = login.body.access_token;
    const res = await request(app.getHttpServer()).get('/admin/profissionais').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeLessThan(400);
    expect(res.body).toBeDefined();
    expect(res.body.data || res.body.length || Array.isArray(res.body)).toBeTruthy();
  });
});
