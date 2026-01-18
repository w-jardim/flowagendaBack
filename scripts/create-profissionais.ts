import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';
import * as bcrypt from 'bcrypt';

const users = [
  { nome: 'Enfermeira Maria', email: 'enfermeira@flowagenda.com', ocupacao: 'Enfermeira', tipo: 'saude', whatsapp: '11900000001' },
  { nome: 'Barbeiro João', email: 'barbeiro@flowagenda.com', ocupacao: 'Barbeiro', tipo: 'beleza', whatsapp: '11900000002' },
  { nome: 'Eletricista Pedro', email: 'eletricista@flowagenda.com', ocupacao: 'Eletricista', tipo: 'servico', whatsapp: '11900000003' },
];

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profissional);
  const senha = 'flow123';
  const hash = await bcrypt.hash(senha, 10);

  const created: any[] = [];
  for (const u of users) {
    const sql = `
      INSERT INTO profissionais (id, nome, email, senha_hash, tipo, whatsapp, ocupacao, role, status, criado_em, atualizado_em)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'PROFISSIONAL', 'ACTIVE', now(), now())
      ON CONFLICT (email) DO UPDATE SET
        nome = EXCLUDED.nome,
        senha_hash = EXCLUDED.senha_hash,
        tipo = EXCLUDED.tipo,
        whatsapp = EXCLUDED.whatsapp,
        ocupacao = EXCLUDED.ocupacao,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        atualizado_em = now()
      RETURNING id, nome, email;
    `;
    const res: any = await AppDataSource.manager.query(sql, [u.nome, u.email, hash, u.tipo, u.whatsapp, u.ocupacao]);
    if (res && res[0]) created.push(res[0]);
  }

  console.log(JSON.stringify(created, null, 2));
  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
