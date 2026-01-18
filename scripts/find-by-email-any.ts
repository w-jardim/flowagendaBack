import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';
import { Cliente } from '../src/modules/cliente/cliente.entity';

const email = process.argv[2] || 'wallace@flowagenda.com';

async function main() {
  await AppDataSource.initialize();
  const profRepo = AppDataSource.getRepository(Profissional);
  const cliRepo = AppDataSource.getRepository(Cliente);

  const prof = await profRepo.findOne({ where: { email } });
  const cli = await cliRepo.findOne({ where: { email } });

  console.log('profissional:', prof ? JSON.stringify({ id: prof.id, nome: prof.nome, email: prof.email, role: prof.role, status: prof.status, ocupacao: prof.ocupacao }) : 'NOT_FOUND');
  console.log('cliente:', cli ? JSON.stringify({ id: cli.id, nome: cli.nome, email: cli.email, whatsapp: cli.whatsapp }) : 'NOT_FOUND');

  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
