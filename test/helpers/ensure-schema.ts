import AppDataSource from '../../src/data-source';

export async function ensureMetricsSchema() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    // add columns if not exist
    try { await AppDataSource.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS plano_valor numeric(10,2)`); } catch (e) {}
    try { await AppDataSource.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS plano_nome varchar(50)`); } catch (e) {}
    try { await AppDataSource.query(`ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS data_proximo_pagamento timestamptz`); } catch (e) {}

    // history table
    try {
      await AppDataSource.query(`CREATE TABLE IF NOT EXISTS historico_status_profissional (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profissional_id uuid NOT NULL,
        status_anterior varchar(20) NOT NULL,
        status_novo varchar(20) NOT NULL,
        data_alteracao timestamptz NOT NULL DEFAULT now()
      )`);
    } catch (e) {}

    // indexes
    try { await AppDataSource.query(`CREATE INDEX IF NOT EXISTS idx_profissional_criado_em ON profissionais (criado_em)`); } catch (e) {}
    try { await AppDataSource.query(`CREATE INDEX IF NOT EXISTS idx_profissional_status ON profissionais (status)`); } catch (e) {}
    try { await AppDataSource.query(`CREATE INDEX IF NOT EXISTS idx_profissional_data_expiracao ON profissionais (data_expiracao_assinatura)`); } catch (e) {}
    try { await AppDataSource.query(`CREATE INDEX IF NOT EXISTS idx_agendamento_data_inicio ON agendamentos (data_inicio)`); } catch (e) {}
    try { await AppDataSource.query(`CREATE INDEX IF NOT EXISTS idx_agendamento_status ON agendamentos (status)`); } catch (e) {}

    await AppDataSource.destroy();
  } catch (err) {
    try { await AppDataSource.destroy(); } catch (e) {}
    throw err;
  }
}
