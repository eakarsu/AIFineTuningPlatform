const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/custom-models
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM custom_models';
    let countQuery = 'SELECT COUNT(*) FROM custom_models';
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
    console.error('List custom models error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/custom-models/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM custom_models WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get custom model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/custom-models
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, base_model_id, fine_tuning_job_id, version, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO custom_models (name, description, base_model_id, fine_tuning_job_id, version, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || null, base_model_id || null, fine_tuning_job_id || null, version || '1.0.0', status || 'training', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create custom model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/custom-models/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, base_model_id, fine_tuning_job_id, version, status, performance_metrics, endpoint_url } = req.body;

    const result = await db.query(
      `UPDATE custom_models
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_model_id = COALESCE($3, base_model_id),
           fine_tuning_job_id = COALESCE($4, fine_tuning_job_id),
           version = COALESCE($5, version),
           status = COALESCE($6, status),
           performance_metrics = COALESCE($7, performance_metrics),
           endpoint_url = COALESCE($8, endpoint_url),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name || null, description || null, base_model_id || null, fine_tuning_job_id || null, version || null, status || null, performance_metrics ? JSON.stringify(performance_metrics) : null, endpoint_url || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update custom model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/custom-models/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM custom_models WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }
    res.json({ message: 'Custom model deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete custom model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/custom-models/:id/ai-evaluate
router.post('/:id/ai-evaluate', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cm.*, bm.name as base_model_name, bm.provider, bm.parameters
       FROM custom_models cm
       LEFT JOIN base_models bm ON cm.base_model_id = bm.id
       WHERE cm.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Custom model not found' });
    }

    const model = result.rows[0];
    const prompt = `Evaluate the following custom fine-tuned model and provide a comprehensive assessment:

Model Name: ${model.name}
Description: ${model.description || 'N/A'}
Base Model: ${model.base_model_name || 'Unknown'} (${model.provider || 'Unknown'})
Version: ${model.version}
Status: ${model.status}
Performance Metrics: ${JSON.stringify(model.performance_metrics)}

Please provide:
1. Overall quality assessment
2. Strengths and weaknesses
3. Comparison to base model expectations
4. Deployment readiness evaluation
5. Recommendations for improvement
6. Risk assessment for production use`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ model_id: model.id, evaluation: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI evaluate error:', err);
    res.status(500).json({ error: 'Failed to get AI evaluation' });
  }
});

module.exports = router;
