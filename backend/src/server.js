const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
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

app.listen(PORT, () => {
  console.log(`AI Fine-Tuning Platform backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
