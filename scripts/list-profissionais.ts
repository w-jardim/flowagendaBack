import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profissional);
  const rows = await repo.createQueryBuilder('p').select(['p.id', 'p.nome']).orderBy('p.nome','ASC').getRawMany();
  const names = rows.map(r => ({ id: r.p_id ?? r.id ?? r.p_id, nome: r.p_nome ?? r.nome ?? r.p_nome }));
  // print JSON and human-readable list
  console.log(JSON.stringify(names.map(n => n.nome)));
  names.forEach(n => console.log(n.nome));
  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
