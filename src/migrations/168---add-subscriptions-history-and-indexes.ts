import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionsHistoryAndIndexes1680000000000 implements MigrationInterface {
  name = 'AddSubscriptionsHistoryAndIndexes1680000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS plano_valor numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS plano_nome varchar(50)`);
    await queryRunner.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS data_proximo_pagamento timestamptz`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS historico_status_profissional (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profissional_id uuid NOT NULL,
      status_anterior varchar(20) NOT NULL,
      status_novo varchar(20) NOT NULL,
      data_alteracao timestamptz NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_profissional_criado_em ON profissionais (criado_em)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_profissional_status ON profissionais (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_profissional_data_expiracao ON profissionais (data_expiracao_assinatura)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_agendamento_data_inicio ON agendamentos (data_inicio)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_agendamento_status ON agendamentos (status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agendamento_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agendamento_data_inicio`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_profissional_data_expiracao`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_profissional_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_profissional_criado_em`);

    await queryRunner.query(`DROP TABLE IF EXISTS historico_status_profissional`);

    await queryRunner.query(`ALTER TABLE profissionais DROP COLUMN IF EXISTS data_proximo_pagamento`);
    await queryRunner.query(`ALTER TABLE profissionais DROP COLUMN IF EXISTS plano_nome`);
    await queryRunner.query(`ALTER TABLE profissionais DROP COLUMN IF EXISTS plano_valor`);
  }
}
