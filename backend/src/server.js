const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// --- Security middleware ---
app.use(helmet({ contentSecurityPolicy: false }));

// CORS allowlist driven by env (comma-separated). Default localhost:3000.
const corsAllowlist = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsAllowlist.includes('*') || corsAllowlist.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// AI rate limiter applied to AI-heavy paths (20/hr by user)
const authMiddleware = require('./middleware/auth');
const { aiRateLimiter } = require('./middleware/rateLimiter');

const AI_PATHS = [
  '/api/fine-tuning-jobs/:id/ai-optimize',
  '/api/datasets/:id/ai-analyze',
  '/api/deployments/:id/ai-scale',
  '/api/base-models/:id/ai-analyze',
  '/api/data-pipelines/:id/ai-optimize',
  '/api/evaluations/:id/ai-analyze',
  '/api/model-comparisons/:id/ai-analyze',
  '/api/prompt-templates/:id/ai-improve',
  '/api/training-configs/:id/ai-suggest',
  '/api/custom-models/:id/ai-analyze',
];
// Rate limit middleware for any sub-path containing /ai- by mounting per-router.
// Express doesn't allow path patterns like above directly via app.use, so we
// install a small middleware that enforces the limiter when path contains /ai-.
app.use(async (req, res, next) => {
  if (req.path.includes('/ai-') || req.path.includes('/ai_')) {
    return authMiddleware(req, res, (err) => {
      if (err) return;
      return aiRateLimiter(req, res, next);
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fine-tuning-jobs', require('./routes/fineTuningJobs'));
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/base-models', require('./routes/baseModels'));
app.use('/api/custom-models', require('./routes/customModels'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/api-keys', require('./routes/apiKeys'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/training-configs', require('./routes/trainingConfigs'));
app.use('/api/data-pipelines', require('./routes/dataPipelines'));
app.use('/api/model-comparisons', require('./routes/modelComparisons'));
app.use('/api/prompt-templates', require('./routes/promptTemplates'));
app.use('/api/usage-billing', require('./routes/usageBilling'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/team-members', require('./routes/teamMembers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/scheduled-tasks', require('./routes/scheduledTasks'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/files', require('./routes/files'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/system-settings', require('./routes/systemSettings'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/search', require('./routes/globalSearch'));
app.use('/api/export', require('./routes/exportData'));
app.use('/api/inference', require('./routes/inference')); // new: API-key inference proxy
app.use('/api/ai-results', require('./routes/aiResults')); // new: AI run history
app.use('/api/cost-estimator', require('./routes/costEstimator')); // new: fine-tuning cost estimation
app.use('/api/bayesian-search', require('./routes/bayesianSearch')); // apply pass 4: Bayesian HP search
app.use('/api/prompt-ab', require('./routes/promptABTester')); // apply pass 4: Prompt A/B tester
app.use('/api/marketplace', require('./routes/modelMarketplace')); // apply pass 5: model marketplace listing
app.use('/api/deployment-templates', require('./routes/deploymentTemplates')); // apply pass 5: one-click deployment templates
app.use('/api/huggingface', require('./routes/huggingfaceIntegration')); // apply pass 5: HF Hub integration (gated on HF_API_KEY)
app.use('/api/agentic-trainer', require('./routes/agenticTrainer'));
app.use('/api/hyperparam-tuner', require('./routes/hyperparamTuner'));
app.use('/api/cost-optimization', require('./routes/costOptimization'));
app.use('/api/marketplace-listing', require('./routes/marketplaceListing'));
app.use('/api/one-click-deploy', require('./routes/oneClickDeploy'));
app.use('/api/drift-monitor', require('./routes/driftMonitor'));
app.use('/api/prompt-engineering', require('./routes/promptEngineering'));
app.use('/api/custom-views', require('./routes/customViews')); // Training Views: 2 viz + 2 wizards

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Init ai_results table at startup
require('./services/aiResultsStore').ensureTable().catch((e) =>
  console.warn('ai_results init failed:', e.message)
);

// Start background workers
require('./services/finetuneRunner').startRunner();
require('./services/webhookDispatcher').startWebhookDispatcher();


// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('../routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
  console.log(`AI Fine-Tuning Platform backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`CORS allowlist: ${corsAllowlist.join(', ')}`);
});

module.exports = app;
