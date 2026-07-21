'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const corsAllowlist = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((v) => v.trim()).filter(Boolean);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: (origin, callback) => !origin || corsAllowlist.includes(origin) ? callback(null, true) : callback(new Error('Origin is not allowed')), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', supported_workflow: '/api/governed-lifecycle', legacy_routes: process.env.ENABLE_LEGACY_ROUTES === 'true' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governed-lifecycle', require('./routes/governedLifecycle'));

if (process.env.ENABLE_LEGACY_ROUTES === 'true') {
  const legacy = {
    'fine-tuning-jobs': 'fineTuningJobs', datasets: 'datasets', 'base-models': 'baseModels', 'custom-models': 'customModels',
    evaluations: 'evaluations', 'api-keys': 'apiKeys', deployments: 'deployments', 'training-configs': 'trainingConfigs',
    'data-pipelines': 'dataPipelines', 'model-comparisons': 'modelComparisons', 'prompt-templates': 'promptTemplates',
    'usage-billing': 'usageBilling', 'audit-logs': 'auditLogs', 'team-members': 'teamMembers', dashboard: 'dashboard',
    notifications: 'notifications', webhooks: 'webhooks', tags: 'tags', favorites: 'favorites', comments: 'comments',
    'scheduled-tasks': 'scheduledTasks', reports: 'reports', files: 'files', backups: 'backups', 'system-settings': 'systemSettings',
    profile: 'profile', search: 'globalSearch', export: 'exportData', inference: 'inference', 'ai-results': 'aiResults',
    'cost-estimator': 'costEstimator', 'bayesian-search': 'bayesianSearch', 'prompt-ab': 'promptABTester', marketplace: 'modelMarketplace',
    'deployment-templates': 'deploymentTemplates', huggingface: 'huggingfaceIntegration', 'agentic-trainer': 'agenticTrainer',
    'hyperparam-tuner': 'hyperparamTuner', 'cost-optimization': 'costOptimization', 'marketplace-listing': 'marketplaceListing',
    'one-click-deploy': 'oneClickDeploy', 'drift-monitor': 'driftMonitor', 'prompt-engineering': 'promptEngineering',
    'custom-views': 'customViews', 'dataset-leakage': 'datasetLeakageGuard',
  };
  for (const [url, moduleName] of Object.entries(legacy)) app.use(`/api/${url}`, require(`./routes/${moduleName}`));
}

app.use((req, res) => res.status(404).json({ error: 'Route not found; the legacy demo surface is disabled by default' }));
app.use((err, req, res, next) => { console.error('Request failed:', err.message); res.status(500).json({ error: 'Internal server error' }); });

if (require.main === module) app.listen(PORT, HOST, () => {
  console.log(`AI Fine-Tuning Platform API: http://${HOST}:${PORT}`);
  console.log(`Legacy routes: ${process.env.ENABLE_LEGACY_ROUTES === 'true' ? 'enabled' : 'disabled'}`);
});
module.exports = app;
