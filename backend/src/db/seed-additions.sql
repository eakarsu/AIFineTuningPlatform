-- Seed data for new non-AI feature tables

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
(1, 'Welcome to AI FineTune', 'Your account has been set up successfully. Start by exploring the dashboard.', 'success', true, '/'),
(1, 'New Team Member', 'Sarah Chen has joined the ML Engineering team.', 'info', true, '/team-members'),
(1, 'Deployment Alert', 'Production deployment "GPT-4 Custom v2" is running at 95% capacity.', 'warning', false, '/deployments'),
(1, 'Billing Update', 'Your monthly invoice for February is ready.', 'info', false, '/usage-billing'),
(1, 'Security Notice', 'API key "prod-inference-key" was used from a new IP address.', 'warning', false, '/api-keys'),
(1, 'System Maintenance', 'Scheduled maintenance window on March 25, 2026 from 2:00-4:00 AM UTC.', 'info', false, NULL),
(1, 'Job Completed', 'Fine-tuning job "Customer Service Bot v3" completed successfully.', 'success', false, '/fine-tuning-jobs'),
(1, 'Dataset Validation', 'Dataset "Medical QA Pairs" passed validation with 0 errors.', 'success', true, '/datasets'),
(2, 'Welcome to AI FineTune', 'Your account has been set up. Ask your admin for team access.', 'info', true, '/'),
(2, 'New Assignment', 'You have been assigned to the Data Science team.', 'info', false, '/team-members'),
(3, 'Welcome to AI FineTune', 'Your viewer account is ready. Browse models and evaluations.', 'info', true, '/')
ON CONFLICT DO NOTHING;

-- Webhooks
INSERT INTO webhooks (name, url, events, secret, is_active, last_triggered_at, failure_count, user_id) VALUES
('Slack Notifications', 'https://hooks.slack.com/services/T00/B00/xxx', '["job.completed", "job.failed", "deployment.status_changed"]', 'whsec_slack_001', true, NOW() - INTERVAL '2 hours', 0, 1),
('CI/CD Pipeline Trigger', 'https://ci.example.com/api/webhooks/finetune', '["job.completed", "model.created"]', 'whsec_cicd_002', true, NOW() - INTERVAL '1 day', 0, 1),
('PagerDuty Alerts', 'https://events.pagerduty.com/integration/xxx/enqueue', '["deployment.failed", "job.failed", "system.error"]', 'whsec_pd_003', true, NULL, 0, 1),
('Custom Dashboard', 'https://dashboard.internal.com/api/events', '["job.started", "job.completed", "evaluation.completed"]', 'whsec_dash_004', false, NOW() - INTERVAL '5 days', 3, 1),
('Data Sync', 'https://data.example.com/sync/callback', '["dataset.uploaded", "dataset.validated"]', 'whsec_sync_005', true, NOW() - INTERVAL '12 hours', 0, 1),
('Email Service', 'https://mail.example.com/api/send', '["team.member_added", "team.member_removed"]', 'whsec_mail_006', true, NOW() - INTERVAL '3 days', 1, 1),
('Monitoring', 'https://monitor.example.com/ingest', '["deployment.scaling", "deployment.health_check"]', 'whsec_mon_007', true, NOW() - INTERVAL '30 minutes', 0, 2),
('Audit Webhook', 'https://audit.example.com/events', '["user.login", "user.logout", "api_key.created"]', 'whsec_audit_008', true, NOW() - INTERVAL '1 hour', 0, 1)
ON CONFLICT DO NOTHING;

-- Tags
INSERT INTO tags (name, color, user_id) VALUES
('production', '#ff4757', 1),
('staging', '#ffa502', 1),
('experimental', '#6c63ff', 1),
('high-priority', '#ff6b81', 1),
('deprecated', '#a0a0b8', 1),
('nlp', '#00d4aa', 1),
('vision', '#1e90ff', 1),
('code-gen', '#ff9f43', 1),
('healthcare', '#ee5a24', 1),
('finance', '#0abde3', 1),
('v2', '#10ac84', 1),
('benchmark', '#5f27cd', 1),
('production', '#ff4757', 2),
('testing', '#ffa502', 2),
('research', '#6c63ff', 2)
ON CONFLICT DO NOTHING;

-- Resource Tags
INSERT INTO resource_tags (tag_id, resource_type, resource_id) VALUES
(1, 'deployment', 1), (1, 'custom_model', 1), (6, 'fine_tuning_job', 1),
(2, 'deployment', 2), (3, 'fine_tuning_job', 3), (6, 'dataset', 1),
(7, 'dataset', 5), (8, 'fine_tuning_job', 2), (4, 'fine_tuning_job', 4),
(9, 'dataset', 3), (10, 'dataset', 4), (11, 'custom_model', 2),
(12, 'evaluation', 1), (12, 'evaluation', 2)
ON CONFLICT DO NOTHING;

-- Favorites
INSERT INTO favorites (user_id, resource_type, resource_id, resource_name) VALUES
(1, 'fine_tuning_job', 1, 'Customer Service Bot v3'),
(1, 'custom_model', 1, 'CS-Bot-GPT4-FT'),
(1, 'dataset', 1, 'Customer Support Conversations'),
(1, 'deployment', 1, 'Production CS Bot'),
(1, 'evaluation', 1, 'CS Bot Accuracy Test'),
(1, 'prompt_template', 1, 'Customer Service Response'),
(1, 'base_model', 1, 'GPT-4 Turbo'),
(2, 'fine_tuning_job', 2, 'Code Assistant v1'),
(2, 'dataset', 2, 'Stack Overflow QA Pairs'),
(2, 'base_model', 3, 'Claude 3.5 Sonnet')
ON CONFLICT DO NOTHING;

-- Comments
INSERT INTO comments (user_id, resource_type, resource_id, content, parent_id) VALUES
(1, 'fine_tuning_job', 1, 'Initial training run looks promising. Loss curve is smooth.', NULL),
(2, 'fine_tuning_job', 1, 'Agreed, the validation metrics are improving steadily.', 1),
(1, 'fine_tuning_job', 1, 'Pushed to staging for team review. Please test edge cases.', NULL),
(1, 'dataset', 1, 'Added 5000 new samples from March support tickets.', NULL),
(3, 'dataset', 1, 'The new samples look clean. Good distribution across categories.', 4),
(1, 'deployment', 1, 'Scaled to 3 replicas for peak traffic hours.', NULL),
(2, 'deployment', 1, 'Latency looks good at p99. No issues observed.', 6),
(1, 'custom_model', 1, 'This model outperforms v1 by 12% on our benchmark suite.', NULL),
(1, 'evaluation', 1, 'Running extended evaluation with adversarial prompts.', NULL),
(2, 'evaluation', 1, 'Results are in - model handles edge cases much better now.', 9),
(1, 'fine_tuning_job', 2, 'Code completion accuracy is at 87%. Need to improve on multi-file context.', NULL),
(2, 'fine_tuning_job', 2, 'Try increasing context length and adding more repo-level examples.', 11)
ON CONFLICT DO NOTHING;

-- Scheduled Tasks
INSERT INTO scheduled_tasks (name, description, task_type, schedule, config, status, last_run_at, next_run_at, run_count, user_id) VALUES
('Daily Model Health Check', 'Check all deployed models for performance degradation', 'health_check', '0 6 * * *', '{"check_latency": true, "check_accuracy": true, "threshold": 0.95}', 'active', NOW() - INTERVAL '18 hours', NOW() + INTERVAL '6 hours', 45, 1),
('Weekly Dataset Backup', 'Backup all training datasets to cloud storage', 'backup', '0 2 * * 0', '{"destination": "s3://backups/datasets", "compress": true}', 'active', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 12, 1),
('Monthly Usage Report', 'Generate monthly usage and billing report', 'report', '0 0 1 * *', '{"report_type": "usage_summary", "format": "pdf", "email": true}', 'active', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 6, 1),
('Hourly Log Rotation', 'Rotate and compress audit log files', 'maintenance', '0 * * * *', '{"max_age_days": 90, "compress": true}', 'active', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '15 minutes', 1080, 1),
('Nightly Evaluation Suite', 'Run standard evaluation suite against all production models', 'evaluation', '0 1 * * *', '{"eval_types": ["accuracy", "safety", "hallucination"], "models": "production"}', 'active', NOW() - INTERVAL '23 hours', NOW() + INTERVAL '1 hour', 30, 1),
('API Key Expiry Check', 'Check for API keys expiring within 7 days and send alerts', 'alert', '0 8 * * 1', '{"days_before_expiry": 7, "notify": "email"}', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 8, 1),
('Dataset Validation', 'Validate newly uploaded datasets for quality', 'validation', '*/30 * * * *', '{"check_duplicates": true, "check_format": true, "min_quality_score": 0.8}', 'paused', NOW() - INTERVAL '2 days', NULL, 96, 1),
('Staging Cleanup', 'Remove old staging deployments older than 14 days', 'cleanup', '0 3 * * 1', '{"environment": "staging", "max_age_days": 14}', 'active', NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', 15, 1),
('Cost Anomaly Detection', 'Monitor for unusual spending patterns', 'monitoring', '0 */4 * * *', '{"threshold_multiplier": 2.0, "window_hours": 24}', 'active', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 hours', 180, 1),
('Model Registry Sync', 'Sync model registry with external model hub', 'sync', '0 0 * * *', '{"source": "huggingface", "auto_import": false}', 'inactive', NOW() - INTERVAL '10 days', NULL, 20, 2)
ON CONFLICT DO NOTHING;

-- Reports
INSERT INTO reports (name, description, report_type, parameters, result_data, format, status, user_id, completed_at) VALUES
('Monthly Usage Report - Feb 2026', 'Comprehensive usage metrics for February', 'usage_summary', '{"period": "2026-02", "include_costs": true}', '{"total_tokens": 45000000, "total_cost": 1234.56, "top_models": ["CS-Bot-v3", "Code-Assistant-v1"]}', 'json', 'completed', 1, NOW() - INTERVAL '20 days'),
('Model Performance Benchmark Q1', 'Quarterly benchmark across all production models', 'benchmark', '{"quarter": "Q1-2026", "metrics": ["accuracy", "latency", "throughput"]}', '{"models_tested": 8, "avg_accuracy": 0.94, "avg_latency_ms": 120}', 'json', 'completed', 1, NOW() - INTERVAL '5 days'),
('Team Productivity Report', 'Team activity and contribution metrics', 'team_activity', '{"team": "ML Engineering", "period": "2026-03"}', NULL, 'pdf', 'pending', 1, NULL),
('Cost Analysis Report', 'Detailed cost breakdown by model and department', 'cost_analysis', '{"period": "2026-Q1", "group_by": "department"}', '{"total_cost": 5678.90, "departments": {"engineering": 3500, "research": 2178.90}}', 'csv', 'completed', 1, NOW() - INTERVAL '2 days'),
('Security Audit Report', 'API key usage and access pattern analysis', 'security_audit', '{"period": "2026-03", "include_ip_analysis": true}', NULL, 'pdf', 'generating', 1, NULL),
('Dataset Quality Report', 'Quality metrics across all training datasets', 'data_quality', '{"min_samples": 100}', '{"datasets_analyzed": 18, "avg_quality": 0.89, "issues_found": 3}', 'json', 'completed', 1, NOW() - INTERVAL '7 days'),
('Deployment Health Report', 'Uptime and performance of all deployments', 'deployment_health', '{"environment": "all", "period": "last_30_days"}', '{"avg_uptime": 99.7, "total_requests": 12500000, "avg_latency_ms": 95}', 'json', 'completed', 1, NOW() - INTERVAL '1 day'),
('Model Comparison Report', 'Side-by-side comparison of top 5 models', 'comparison', '{"model_ids": [1,2,3,4,5]}', NULL, 'pdf', 'failed', 2, NULL)
ON CONFLICT DO NOTHING;

-- Files
INSERT INTO files (name, original_name, mime_type, size_bytes, path, category, description, user_id) VALUES
('training_data_cs_v3.jsonl', 'customer_support_v3.jsonl', 'application/jsonl', 52428800, '/uploads/datasets/training_data_cs_v3.jsonl', 'dataset', 'Customer service training data version 3', 1),
('eval_results_feb.csv', 'evaluation_results_february.csv', 'text/csv', 1048576, '/uploads/reports/eval_results_feb.csv', 'report', 'February evaluation results export', 1),
('model_config_gpt4ft.json', 'gpt4_finetune_config.json', 'application/json', 2048, '/uploads/configs/model_config_gpt4ft.json', 'config', 'GPT-4 fine-tuning configuration', 1),
('prompt_library_v2.json', 'prompt_templates_export.json', 'application/json', 8192, '/uploads/templates/prompt_library_v2.json', 'template', 'Exported prompt template library', 1),
('team_photo.png', 'ml_team_2026.png', 'image/png', 3145728, '/uploads/images/team_photo.png', 'image', 'ML Engineering team photo', 1),
('architecture_diagram.pdf', 'system_architecture_v2.pdf', 'application/pdf', 5242880, '/uploads/docs/architecture_diagram.pdf', 'document', 'Platform architecture documentation', 1),
('benchmark_suite.zip', 'evaluation_benchmark_v1.zip', 'application/zip', 104857600, '/uploads/benchmarks/benchmark_suite.zip', 'benchmark', 'Standard evaluation benchmark suite', 1),
('api_docs.md', 'api_documentation.md', 'text/markdown', 32768, '/uploads/docs/api_docs.md', 'document', 'API endpoint documentation', 1),
('training_logs.tar.gz', 'job_logs_march2026.tar.gz', 'application/gzip', 209715200, '/uploads/logs/training_logs.tar.gz', 'log', 'Compressed training job logs', 2),
('sample_data.csv', 'quick_test_data.csv', 'text/csv', 4096, '/uploads/datasets/sample_data.csv', 'dataset', 'Small sample dataset for testing', 2)
ON CONFLICT DO NOTHING;

-- Backups
INSERT INTO backups (name, description, backup_type, size_mb, status, file_path, tables_included, user_id, completed_at) VALUES
('Full Backup - March 15', 'Weekly full platform backup', 'full', 2048.50, 'completed', '/backups/full_20260315.tar.gz', '["users", "training_datasets", "fine_tuning_jobs", "custom_models", "evaluations", "deployments"]', 1, NOW() - INTERVAL '6 days'),
('Full Backup - March 8', 'Weekly full platform backup', 'full', 1985.75, 'completed', '/backups/full_20260308.tar.gz', '["users", "training_datasets", "fine_tuning_jobs", "custom_models", "evaluations", "deployments"]', 1, NOW() - INTERVAL '13 days'),
('Datasets Only - March 18', 'Incremental dataset backup', 'incremental', 512.25, 'completed', '/backups/datasets_20260318.tar.gz', '["training_datasets"]', 1, NOW() - INTERVAL '3 days'),
('Models & Configs', 'Custom models and training configurations', 'partial', 256.80, 'completed', '/backups/models_configs_20260319.tar.gz', '["custom_models", "training_configs", "fine_tuning_jobs"]', 1, NOW() - INTERVAL '2 days'),
('Pre-Migration Backup', 'Safety backup before schema migration', 'full', 2100.00, 'completed', '/backups/pre_migration_20260310.tar.gz', '["users", "training_datasets", "fine_tuning_jobs", "custom_models", "evaluations", "deployments", "api_keys"]', 1, NOW() - INTERVAL '11 days'),
('Audit Logs Archive', 'Quarterly audit log archive', 'partial', 128.40, 'completed', '/backups/audit_logs_q1_2026.tar.gz', '["audit_logs"]', 1, NOW() - INTERVAL '1 day'),
('Emergency Backup', 'Emergency backup before deployment rollback', 'full', 2050.00, 'in_progress', NULL, '["users", "training_datasets", "fine_tuning_jobs", "custom_models", "evaluations", "deployments"]', 1, NULL),
('User Data Export', 'GDPR data export for user request', 'partial', 15.20, 'completed', '/backups/user_export_20260320.tar.gz', '["users", "user_preferences"]', 1, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- System Settings
INSERT INTO system_settings (key, value, category, description, updated_by) VALUES
('platform_name', '"AI FineTune Platform"', 'general', 'Platform display name', 1),
('max_upload_size_mb', '500', 'general', 'Maximum file upload size in MB', 1),
('default_items_per_page', '20', 'general', 'Default pagination size', 1),
('maintenance_mode', 'false', 'general', 'Enable maintenance mode', 1),
('session_timeout_hours', '24', 'security', 'JWT token expiration in hours', 1),
('max_login_attempts', '5', 'security', 'Max failed login attempts before lockout', 1),
('password_min_length', '8', 'security', 'Minimum password length', 1),
('two_factor_enabled', 'false', 'security', 'Require 2FA for all users', 1),
('smtp_host', '"smtp.example.com"', 'email', 'SMTP server hostname', 1),
('smtp_port', '587', 'email', 'SMTP server port', 1),
('email_from', '"noreply@aifinetuning.com"', 'email', 'Default sender email', 1),
('max_concurrent_jobs', '10', 'training', 'Maximum concurrent fine-tuning jobs', 1),
('default_gpu_type', '"A100"', 'training', 'Default GPU for training jobs', 1),
('auto_scaling_enabled', 'true', 'deployment', 'Enable auto-scaling for deployments', 1),
('max_replicas', '10', 'deployment', 'Maximum deployment replicas', 1),
('backup_retention_days', '30', 'backup', 'Number of days to retain backups', 1),
('auto_backup_enabled', 'true', 'backup', 'Enable automatic backups', 1),
('log_retention_days', '90', 'logging', 'Audit log retention period in days', 1)
ON CONFLICT DO NOTHING;

-- User Preferences
INSERT INTO user_preferences (user_id, theme, timezone, language, notifications_enabled, email_notifications, items_per_page, sidebar_collapsed) VALUES
(1, 'dark', 'America/New_York', 'en', true, true, 20, false),
(2, 'dark', 'America/Los_Angeles', 'en', true, false, 15, false),
(3, 'dark', 'Europe/London', 'en', true, true, 25, true)
ON CONFLICT DO NOTHING;
