const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const q = req.query.q;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const searchTerm = `%${q.trim()}%`;

    const [jobs, datasets, models, deployments, templates] = await Promise.all([
      db.query(
        `SELECT id, name, 'job' as type, status, created_at
         FROM fine_tuning_jobs
         WHERE name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, 'dataset' as type, status, created_at
         FROM training_datasets
         WHERE name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, 'model' as type, status, created_at
         FROM custom_models
         WHERE name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, 'deployment' as type, status, created_at
         FROM deployments
         WHERE name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm]
      ),
      db.query(
        `SELECT id, name, 'template' as type, category, created_at
         FROM prompt_templates
         WHERE name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm]
      ),
    ]);

    res.json({
      query: q.trim(),
      results: {
        jobs: jobs.rows,
        datasets: datasets.rows,
        models: models.rows,
        deployments: deployments.rows,
        templates: templates.rows,
      },
      total: jobs.rows.length + datasets.rows.length + models.rows.length + deployments.rows.length + templates.rows.length,
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
