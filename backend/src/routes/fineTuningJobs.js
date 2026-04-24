const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/fine-tuning-jobs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM fine_tuning_jobs';
    let countQuery = 'SELECT COUNT(*) FROM fine_tuning_jobs';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' WHERE status = $1';
      countQuery += ' WHERE status = $1';
      params.push(status);
      countParams.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('List fine-tuning jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fine-tuning-jobs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fine_tuning_jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fine-tuning-jobs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, base_model, dataset_id, config } = req.body;

    if (!name || !base_model) {
      return res.status(400).json({ error: 'Name and base_model are required' });
    }

    const result = await db.query(
      `INSERT INTO fine_tuning_jobs (name, description, base_model, dataset_id, status, config, user_id)
       VALUES ($1, $2, $3, $4, 'queued', $5, $6)
       RETURNING *`,
      [name, description || null, base_model, dataset_id || null, config ? JSON.stringify(config) : null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/fine-tuning-jobs/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, base_model, dataset_id, status, config, metrics } = req.body;

    const result = await db.query(
      `UPDATE fine_tuning_jobs
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_model = COALESCE($3, base_model),
           dataset_id = COALESCE($4, dataset_id),
           status = COALESCE($5, status),
           config = COALESCE($6, config),
           metrics = COALESCE($7, metrics),
           updated_at = NOW(),
           completed_at = CASE WHEN $5 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
       WHERE id = $8
       RETURNING *`,
      [
        name || null, description || null, base_model || null, dataset_id || null,
        status || null, config ? JSON.stringify(config) : null,
        metrics ? JSON.stringify(metrics) : null, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fine-tuning-jobs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM fine_tuning_jobs WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    res.json({ message: 'Fine-tuning job deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fine-tuning-jobs/:id/ai-optimize
router.post('/:id/ai-optimize', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fine_tuning_jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }

    const job = result.rows[0];
    const prompt = `Analyze the following fine-tuning job and suggest optimizations to improve performance:

Job Name: ${job.name}
Description: ${job.description || 'N/A'}
Base Model: ${job.base_model}
Status: ${job.status}
Current Config: ${JSON.stringify(job.config)}
Current Metrics: ${JSON.stringify(job.metrics)}

Please provide:
1. Analysis of current configuration
2. Specific optimization suggestions (learning rate, batch size, epochs, etc.)
3. Potential issues to watch for
4. Expected improvement estimates
5. Alternative approaches to consider`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ job_id: job.id, optimization_suggestions: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI optimize error:', err);
    res.status(500).json({ error: 'Failed to get AI optimization suggestions' });
  }
});

module.exports = router;
