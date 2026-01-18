import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';

const email = process.argv[2] || 'wallace@flowagenda.com';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profissional);
  const prof = await repo.createQueryBuilder('p')
    .where('p.email = :email', { email })
    .select(['p.id','p.nome','p.email','p.ocupacao','p.status','p.role','p.criado_em','p.atualizado_em'])
    .getRawOne();

  if (!prof) {
    console.log(`NOT_FOUND`);
  } else {
    // normalize keys from raw result (p_id / id)
    const keys = Object.keys(prof);
    const normalized: Record<string, any> = {};
    keys.forEach(k => {
      const nk = k.replace(/^p_/, '').replace(/^p\./, '').replace(/^\w+_/, (m) => m);
      normalized[nk] = prof[k];
    });
    console.log(JSON.stringify(normalized, null, 2));
  }

  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
