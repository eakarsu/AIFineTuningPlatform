const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const resourceTableMap = {
  'datasets': 'training_datasets',
  'jobs': 'fine_tuning_jobs',
  'models': 'custom_models',
  'evaluations': 'evaluations',
  'deployments': 'deployments',
  'configs': 'training_configs',
  'pipelines': 'data_pipelines',
  'templates': 'prompt_templates',
  'billing': 'usage_billing',
  'api-keys': 'api_keys',
};

// GET /api/export/:resource
router.get('/:resource', authMiddleware, async (req, res) => {
  try {
    const resource = req.params.resource;
    const table = resourceTableMap[resource];

    if (!table) {
      return res.status(400).json({
        error: 'Invalid resource',
        valid_resources: Object.keys(resourceTableMap),
      });
    }

    const result = await db.query(
      `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      resource,
      exported_at: new Date().toISOString(),
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Export data error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
