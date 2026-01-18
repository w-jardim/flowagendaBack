const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'flowagenda',
  });

  await client.connect();
  const res = await client.query('SELECT COUNT(*)::int AS cnt FROM profissionais');
  console.log(res.rows[0].cnt);
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
