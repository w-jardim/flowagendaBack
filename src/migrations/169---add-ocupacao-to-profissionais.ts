import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOcupacaoToProfissionais1690000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profissionais" ADD COLUMN IF NOT EXISTS "ocupacao" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profissionais" DROP COLUMN IF EXISTS "ocupacao"`);
  }
}
