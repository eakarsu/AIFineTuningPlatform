const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/data-pipelines
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT * FROM data_pipelines';
    let countQuery = 'SELECT COUNT(*) FROM data_pipelines';
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
    console.error('List data pipelines error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/data-pipelines/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM data_pipelines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data pipeline not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get data pipeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data-pipelines
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, source_type, destination, steps, schedule } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO data_pipelines (name, description, source_type, destination, steps, status, schedule, user_id)
       VALUES ($1, $2, $3, $4, $5, 'idle', $6, $7)
       RETURNING *`,
      [name, description || null, source_type || null, destination || null, steps ? JSON.stringify(steps) : null, schedule || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create data pipeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/data-pipelines/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, source_type, destination, steps, status, schedule } = req.body;

    const result = await db.query(
      `UPDATE data_pipelines
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           source_type = COALESCE($3, source_type),
           destination = COALESCE($4, destination),
           steps = COALESCE($5, steps),
           status = COALESCE($6, status),
           schedule = COALESCE($7, schedule),
           last_run_at = CASE WHEN $6 = 'running' THEN NOW() ELSE last_run_at END,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name || null, description || null, source_type || null, destination || null, steps ? JSON.stringify(steps) : null, status || null, schedule || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data pipeline not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update data pipeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/data-pipelines/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM data_pipelines WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data pipeline not found' });
    }
    res.json({ message: 'Data pipeline deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete data pipeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data-pipelines/:id/ai-optimize
router.post('/:id/ai-optimize', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM data_pipelines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data pipeline not found' });
    }

    const pipeline = result.rows[0];
    const prompt = `Analyze and optimize the following data pipeline for AI training data:

Pipeline Name: ${pipeline.name}
Description: ${pipeline.description || 'N/A'}
Source Type: ${pipeline.source_type}
Destination: ${pipeline.destination}
Steps: ${JSON.stringify(pipeline.steps)}
Schedule: ${pipeline.schedule || 'Manual'}
Status: ${pipeline.status}
Last Run: ${pipeline.last_run_at || 'Never'}

Please provide:
1. Pipeline efficiency analysis
2. Bottleneck identification
3. Data quality improvement suggestions
4. Optimization recommendations for each step
5. Scheduling optimization
6. Error handling improvements
7. Monitoring and alerting suggestions
8. Cost optimization opportunities`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ pipeline_id: pipeline.id, optimization_suggestions: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI optimize pipeline error:', err);
    res.status(500).json({ error: 'Failed to get AI optimization suggestions' });
  }
});

module.exports = router;
