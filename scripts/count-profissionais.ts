import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profissional);
  const count = await repo.count();
  console.log(count);
  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
