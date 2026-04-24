const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/model-comparisons
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM model_comparisons';
    let countQuery = 'SELECT COUNT(*) FROM model_comparisons';
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
    console.error('List model comparisons error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/model-comparisons/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM model_comparisons WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model comparison not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get model comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/model-comparisons
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, model_ids, metrics } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO model_comparisons (name, description, model_ids, metrics, status, user_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [name, description || null, model_ids ? JSON.stringify(model_ids) : null, metrics ? JSON.stringify(metrics) : null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create model comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/model-comparisons/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, model_ids, metrics, results, status } = req.body;

    const result = await db.query(
      `UPDATE model_comparisons
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           model_ids = COALESCE($3, model_ids),
           metrics = COALESCE($4, metrics),
           results = COALESCE($5, results),
           status = COALESCE($6, status),
           completed_at = CASE WHEN $6 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $7
       RETURNING *`,
      [name || null, description || null, model_ids ? JSON.stringify(model_ids) : null, metrics ? JSON.stringify(metrics) : null, results ? JSON.stringify(results) : null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model comparison not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update model comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/model-comparisons/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM model_comparisons WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model comparison not found' });
    }
    res.json({ message: 'Model comparison deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete model comparison error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/model-comparisons/:id/ai-analyze
router.post('/:id/ai-analyze', authMiddleware, async (req, res) => {
  try {
    const compResult = await db.query('SELECT * FROM model_comparisons WHERE id = $1', [req.params.id]);
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model comparison not found' });
    }

    const comparison = compResult.rows[0];

    // Fetch model details
    let modelDetails = [];
    if (comparison.model_ids && Array.isArray(comparison.model_ids)) {
      const modelsResult = await db.query(
        'SELECT id, name, status, performance_metrics FROM custom_models WHERE id = ANY($1)',
        [comparison.model_ids]
      );
      modelDetails = modelsResult.rows;
    }

    const prompt = `Analyze the following model comparison and provide insights:

Comparison: ${comparison.name}
Description: ${comparison.description || 'N/A'}
Metrics Being Compared: ${JSON.stringify(comparison.metrics)}
Current Results: ${JSON.stringify(comparison.results)}

Models Being Compared:
${modelDetails.map(m => `- ${m.name} (${m.status}): ${JSON.stringify(m.performance_metrics)}`).join('\n')}

Please provide:
1. Comprehensive comparison analysis
2. Winner recommendation with justification
3. Trade-off analysis (performance vs cost vs latency)
4. Use case recommendations for each model
5. Statistical significance assessment
6. Recommendations for further evaluation`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ comparison_id: comparison.id, analysis: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI analyze comparison error:', err);
    res.status(500).json({ error: 'Failed to get AI analysis' });
  }
});

module.exports = router;
