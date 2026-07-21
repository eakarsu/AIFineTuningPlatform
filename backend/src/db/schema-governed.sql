ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS governed_dataset_versions (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  dataset_ref VARCHAR(200) NOT NULL,
  version VARCHAR(100) NOT NULL,
  sha256 CHAR(64) NOT NULL,
  source TEXT NOT NULL,
  license_attested BOOLEAN NOT NULL,
  license_ref TEXT NOT NULL,
  leakage_detected BOOLEAN NOT NULL,
  split_manifest JSONB NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, dataset_ref, version),
  UNIQUE (tenant_id, sha256)
);

CREATE TABLE IF NOT EXISTS governed_training_runs (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  external_ref VARCHAR(200) NOT NULL,
  dataset_version_id UUID NOT NULL REFERENCES governed_dataset_versions(id),
  base_model_ref TEXT NOT NULL,
  recipe JSONB NOT NULL,
  resource_caps JSONB NOT NULL,
  status VARCHAR(60) NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL REFERENCES users(id),
  training_approved_by INTEGER REFERENCES users(id),
  external_execution JSONB,
  evaluation JSONB,
  artifact JSONB,
  deployment_approved_by INTEGER REFERENCES users(id),
  failure_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, external_ref)
);
CREATE INDEX IF NOT EXISTS governed_training_runs_tenant_status_idx ON governed_training_runs (tenant_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS governed_training_audit (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES governed_training_runs(id),
  tenant_id VARCHAR(100) NOT NULL,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  actor_role VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  from_status VARCHAR(60),
  to_status VARCHAR(60),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION prevent_governed_training_audit_change() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'governed_training_audit is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governed_training_audit_immutable ON governed_training_audit;
CREATE TRIGGER governed_training_audit_immutable BEFORE UPDATE OR DELETE ON governed_training_audit
FOR EACH ROW EXECUTE FUNCTION prevent_governed_training_audit_change();
