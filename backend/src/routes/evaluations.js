const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/evaluations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM evaluations';
    let countQuery = 'SELECT COUNT(*) FROM evaluations';
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
    console.error('List evaluations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/evaluations/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM evaluations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get evaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/evaluations
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, model_id, dataset_id, eval_type, metrics } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO evaluations (name, description, model_id, dataset_id, eval_type, metrics, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [name, description || null, model_id || null, dataset_id || null, eval_type || null, metrics ? JSON.stringify(metrics) : null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create evaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/evaluations/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, model_id, dataset_id, eval_type, metrics, status, results } = req.body;

    const result = await db.query(
      `UPDATE evaluations
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           model_id = COALESCE($3, model_id),
           dataset_id = COALESCE($4, dataset_id),
           eval_type = COALESCE($5, eval_type),
           metrics = COALESCE($6, metrics),
           status = COALESCE($7, status),
           results = COALESCE($8, results),
           completed_at = CASE WHEN $7 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
       WHERE id = $9
       RETURNING *`,
      [name || null, description || null, model_id || null, dataset_id || null, eval_type || null, metrics ? JSON.stringify(metrics) : null, status || null, results ? JSON.stringify(results) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update evaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/evaluations/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM evaluations WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json({ message: 'Evaluation deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete evaluation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/evaluations/:id/ai-run
router.post('/:id/ai-run', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, cm.name as model_name, cm.performance_metrics, td.name as dataset_name, td.num_samples, td.category as dataset_category
       FROM evaluations e
       LEFT JOIN custom_models cm ON e.model_id = cm.id
       LEFT JOIN training_datasets td ON e.dataset_id = td.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    const evaluation = result.rows[0];
    const prompt = `Run a simulated AI evaluation and generate realistic results for the following:

Evaluation: ${evaluation.name}
Description: ${evaluation.description || 'N/A'}
Model: ${evaluation.model_name || 'Unknown'}
Model Performance: ${JSON.stringify(evaluation.performance_metrics)}
Dataset: ${evaluation.dataset_name || 'Unknown'} (${evaluation.num_samples || 0} samples, ${evaluation.dataset_category || 'unknown'} category)
Evaluation Type: ${evaluation.eval_type}
Metrics to Evaluate: ${JSON.stringify(evaluation.metrics)}

Please provide:
1. Simulated evaluation results for each metric
2. Detailed analysis of model performance
3. Comparison to industry benchmarks
4. Areas of strength and weakness
5. Actionable recommendations for improvement
6. Confidence intervals for each metric`;

    const aiResponse = await callOpenRouter(prompt);

    // Update evaluation status
    await db.query(
      `UPDATE evaluations SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ evaluation_id: evaluation.id, results: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI run evaluation error:', err);
    res.status(500).json({ error: 'Failed to run AI evaluation' });
  }
});

module.exports = router;
