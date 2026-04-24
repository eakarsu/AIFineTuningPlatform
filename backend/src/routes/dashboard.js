const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [
      usersCount,
      jobsCount,
      jobsByStatus,
      datasetsCount,
      baseModelsCount,
      customModelsCount,
      customModelsByStatus,
      evaluationsCount,
      apiKeysCount,
      deploymentsCount,
      deploymentsByStatus,
      deploymentsByEnv,
      trainingConfigsCount,
      dataPipelinesCount,
      modelComparisonsCount,
      promptTemplatesCount,
      billingTotals,
      recentAuditLogs,
      teamMembersCount,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM fine_tuning_jobs'),
      db.query('SELECT status, COUNT(*) as count FROM fine_tuning_jobs GROUP BY status'),
      db.query('SELECT COUNT(*) FROM training_datasets'),
      db.query('SELECT COUNT(*) FROM base_models'),
      db.query('SELECT COUNT(*) FROM custom_models'),
      db.query('SELECT status, COUNT(*) as count FROM custom_models GROUP BY status'),
      db.query('SELECT COUNT(*) FROM evaluations'),
      db.query('SELECT COUNT(*) FROM api_keys WHERE is_active = true'),
      db.query('SELECT COUNT(*) FROM deployments'),
      db.query('SELECT status, COUNT(*) as count FROM deployments GROUP BY status'),
      db.query('SELECT environment, COUNT(*) as count FROM deployments GROUP BY environment'),
      db.query('SELECT COUNT(*) FROM training_configs'),
      db.query('SELECT COUNT(*) FROM data_pipelines'),
      db.query('SELECT COUNT(*) FROM model_comparisons'),
      db.query('SELECT COUNT(*) FROM prompt_templates'),
      db.query('SELECT SUM(tokens_used) as total_tokens, SUM(compute_hours) as total_compute_hours, SUM(cost) as total_cost FROM usage_billing'),
      db.query(`SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 10`),
      db.query('SELECT COUNT(*) FROM team_members WHERE status = $1', ['active']),
    ]);

    res.json({
      users: parseInt(usersCount.rows[0].count),
      fine_tuning_jobs: {
        total: parseInt(jobsCount.rows[0].count),
        by_status: jobsByStatus.rows.reduce((acc, row) => { acc[row.status] = parseInt(row.count); return acc; }, {}),
      },
      training_datasets: parseInt(datasetsCount.rows[0].count),
      base_models: parseInt(baseModelsCount.rows[0].count),
      custom_models: {
        total: parseInt(customModelsCount.rows[0].count),
        by_status: customModelsByStatus.rows.reduce((acc, row) => { acc[row.status] = parseInt(row.count); return acc; }, {}),
      },
      evaluations: parseInt(evaluationsCount.rows[0].count),
      active_api_keys: parseInt(apiKeysCount.rows[0].count),
      deployments: {
        total: parseInt(deploymentsCount.rows[0].count),
        by_status: deploymentsByStatus.rows.reduce((acc, row) => { acc[row.status] = parseInt(row.count); return acc; }, {}),
        by_environment: deploymentsByEnv.rows.reduce((acc, row) => { acc[row.environment] = parseInt(row.count); return acc; }, {}),
      },
      training_configs: parseInt(trainingConfigsCount.rows[0].count),
      data_pipelines: parseInt(dataPipelinesCount.rows[0].count),
      model_comparisons: parseInt(modelComparisonsCount.rows[0].count),
      prompt_templates: parseInt(promptTemplatesCount.rows[0].count),
      billing: billingTotals.rows[0],
      recent_activity: recentAuditLogs.rows,
      active_team_members: parseInt(teamMembersCount.rows[0].count),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
