require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres',
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, nome, whatsapp, email, cpf, endereco, criado_em FROM clientes ORDER BY criado_em DESC LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
