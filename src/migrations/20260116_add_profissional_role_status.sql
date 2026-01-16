-- Migration: add role and status to profissionais
-- Run this SQL against your Postgres database
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'PROFISSIONAL';

ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'ACTIVE';

-- Optional: add check constraints to enforce allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'profissionais' AND c.conname = 'profissionais_role_check'
  ) THEN
    ALTER TABLE profissionais
      ADD CONSTRAINT profissionais_role_check CHECK (role IN ('ADMIN','PROFISSIONAL'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'profissionais' AND c.conname = 'profissionais_status_check'
  ) THEN
    ALTER TABLE profissionais
      ADD CONSTRAINT profissionais_status_check CHECK (status IN ('ACTIVE','BLOCKED'));
  END IF;
END$$;
