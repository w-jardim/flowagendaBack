import AppDataSource from '../src/data-source';
import { Profissional } from '../src/modules/profissional/profissional.entity';

const adminEmail = process.argv[2] || 'admin@flowagenda.com';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Profissional);
  const admin = await repo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    console.error('Admin not found:', adminEmail);
    await AppDataSource.destroy();
    process.exit(1);
  }

  console.log('Admin found:', admin.id, admin.email);

  // Delete all profissionais except admin in a transaction
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    // Delete by email != adminEmail
    const res = await queryRunner.manager.createQueryBuilder()
      .delete()
      .from(Profissional)
      .where('email != :adminEmail', { adminEmail })
      .execute();

    console.log('Deleted count (approx):', res.affected ?? res.raw ?? 'unknown');
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Error during cleanup:', err);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }

  // verify
  await AppDataSource.initialize();
  const remaining = await AppDataSource.getRepository(Profissional).find();
  console.log('Remaining profissionais:', remaining.map(p => ({ id: p.id, email: p.email, nome: p.nome })));
  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
