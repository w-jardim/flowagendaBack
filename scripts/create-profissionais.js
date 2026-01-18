const { Client } = require('pg');
const bcrypt = require('bcrypt');

const users = [
  { nome: 'Enfermeira Maria', email: 'enfermeira@flowagenda.com', ocupacao: 'Enfermeira', tipo: 'saude', whatsapp: '11900000001' },
  { nome: 'Barbeiro João', email: 'barbeiro@flowagenda.com', ocupacao: 'Barbeiro', tipo: 'beleza', whatsapp: '11900000002' },
  { nome: 'Eletricista Pedro', email: 'eletricista@flowagenda.com', ocupacao: 'Eletricista', tipo: 'servico', whatsapp: '11900000003' },
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'flowagenda',
  });

  await client.connect();

  const senha = 'flow123';
  const hash = await bcrypt.hash(senha, 10);

  for (const u of users) {
    // Upsert by email
    const text = `
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
        atualizado_em = now();
    `;
    const values = [u.nome, u.email, hash, u.tipo, u.whatsapp, u.ocupacao];
    await client.query(text, values);
    console.log('Upserted', u.email);
  }

  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
