-- AI Fine-Tuning Platform Database Schema

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Datasets
CREATE TABLE IF NOT EXISTS training_datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_format VARCHAR(50),
  num_samples INTEGER DEFAULT 0,
  size_mb DECIMAL(10,2) DEFAULT 0,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'uploading',
  schema_info JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Base Models
CREATE TABLE IF NOT EXISTS base_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255),
  description TEXT,
  parameters VARCHAR(100),
  context_length INTEGER,
  category VARCHAR(100),
  capabilities JSONB,
  pricing_per_1k DECIMAL(10,6),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fine-Tuning Jobs
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_model VARCHAR(255),
  dataset_id INTEGER REFERENCES training_datasets(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'queued',
  config JSONB,
  metrics JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Custom Models
CREATE TABLE IF NOT EXISTS custom_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_model_id INTEGER REFERENCES base_models(id) ON DELETE SET NULL,
  fine_tuning_job_id INTEGER REFERENCES fine_tuning_jobs(id) ON DELETE SET NULL,
  version VARCHAR(50),
  status VARCHAR(50) DEFAULT 'training',
  performance_metrics JSONB,
  endpoint_url VARCHAR(500),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_id INTEGER REFERENCES custom_models(id) ON DELETE SET NULL,
  dataset_id INTEGER REFERENCES training_datasets(id) ON DELETE SET NULL,
  eval_type VARCHAR(100),
  metrics JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  results JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  permissions JSONB,
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Deployments
CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model_id INTEGER REFERENCES custom_models(id) ON DELETE SET NULL,
  environment VARCHAR(50) DEFAULT 'development',
  status VARCHAR(50) DEFAULT 'inactive',
  endpoint_url VARCHAR(500),
  replicas INTEGER DEFAULT 1,
  config JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training Configs
CREATE TABLE IF NOT EXISTS training_configs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  learning_rate DECIMAL(10,8),
  batch_size INTEGER,
  epochs INTEGER,
  warmup_steps INTEGER,
  optimizer VARCHAR(100),
  scheduler VARCHAR(100),
  max_seq_length INTEGER,
  lora_rank INTEGER,
  lora_alpha INTEGER,
  category VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Pipelines
CREATE TABLE IF NOT EXISTS data_pipelines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_type VARCHAR(100),
  destination VARCHAR(255),
  steps JSONB,
  status VARCHAR(50) DEFAULT 'idle',
  schedule VARCHAR(255),
  last_run_at TIMESTAMP,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Model Comparisons
CREATE TABLE IF NOT EXISTS model_comparisons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_ids JSONB,
  metrics JSONB,
  results JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Prompt Templates
CREATE TABLE IF NOT EXISTS prompt_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  template_text TEXT NOT NULL,
  variables JSONB,
  example_output TEXT,
  is_public BOOLEAN DEFAULT false,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage & Billing
CREATE TABLE IF NOT EXISTS usage_billing (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  tokens_used BIGINT DEFAULT 0,
  compute_hours DECIMAL(10,4) DEFAULT 0,
  cost DECIMAL(10,4) DEFAULT 0,
  billing_period VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'invited',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_user ON fine_tuning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_datasets_user ON training_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_models_user ON custom_models(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_billing_user ON usage_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
