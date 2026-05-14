const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/deployments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const environment = req.query.environment;
    const status = req.query.status;

    let query = 'SELECT * FROM deployments';
    let countQuery = 'SELECT COUNT(*) FROM deployments';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (environment) {
      conditions.push(`environment = $${params.length + 1}`);
      params.push(environment);
      countParams.push(environment);
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
      countParams.push(status);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
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
    console.error('List deployments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/deployments/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM deployments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/deployments
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, model_id, environment, endpoint_url, replicas, config } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO deployments (name, model_id, environment, status, endpoint_url, replicas, config, user_id)
       VALUES ($1, $2, $3, 'inactive', $4, $5, $6, $7)
       RETURNING *`,
      [name, model_id || null, environment || 'development', endpoint_url || null, replicas || 1, config ? JSON.stringify(config) : null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/deployments/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, model_id, environment, status, endpoint_url, replicas, config } = req.body;

    const result = await db.query(
      `UPDATE deployments
       SET name = COALESCE($1, name),
           model_id = COALESCE($2, model_id),
           environment = COALESCE($3, environment),
           status = COALESCE($4, status),
           endpoint_url = COALESCE($5, endpoint_url),
           replicas = COALESCE($6, replicas),
           config = COALESCE($7, config),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name || null, model_id || null, environment || null, status || null, endpoint_url || null, replicas || null, config ? JSON.stringify(config) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/deployments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM deployments WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json({ message: 'Deployment deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete deployment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/deployments/:id/ai-scale
router.post('/:id/ai-scale', authMiddleware, async (req, res) => {
  const { parseAIJson } = require('../services/openrouter');
  const { saveAiResult } = require('../services/aiResultsStore');
  const startedAt = Date.now();
  try {
    const result = await db.query(
      `SELECT d.*, cm.name as model_name, cm.performance_metrics
       FROM deployments d
       LEFT JOIN custom_models cm ON d.model_id = cm.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const deployment = result.rows[0];
    if (req.user?.role !== 'admin' && deployment.user_id && String(deployment.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { expected_traffic, latency_target } = req.body;

    const prompt = `Provide scaling recommendations for the following model deployment. Respond with STRICT JSON only.

Deployment: ${deployment.name}
Model: ${deployment.model_name || 'Unknown'}
Environment: ${deployment.environment}
Current Status: ${deployment.status}
Current Replicas: ${deployment.replicas}
Current Config: ${JSON.stringify(deployment.config)}
Model Performance: ${JSON.stringify(deployment.performance_metrics)}
Expected Traffic: ${expected_traffic || 'Not specified'}
Latency Target: ${latency_target || 'Not specified'}

Return JSON of shape:
{
  "replicas": number,
  "autoscaling": { "min": number, "max": number, "trigger_cpu_pct": number },
  "resources": { "gpu": "string", "memory_gb": number, "cpu_cores": number },
  "load_balancing": "string",
  "cost_estimate_usd_per_month": number,
  "optimization_tips": ["string"],
  "monitoring": ["string"]
}`;

    const aiResponse = await callOpenRouter(prompt);
    const parsed = parseAIJson(aiResponse.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'deployments.ai_scale',
      user_id: req.user?.id,
      entity_type: 'deployment',
      entity_id: deployment.id,
      input: { expected_traffic, latency_target, current_replicas: deployment.replicas },
      output: parsed,
      raw: aiResponse.content,
      model: aiResponse.model,
      tokens_in: aiResponse.usage?.prompt_tokens || null,
      tokens_out: aiResponse.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({
      deployment_id: deployment.id,
      scaling_recommendations: aiResponse.content,
      parsed,
      model: aiResponse.model,
      duration_ms: duration,
    });
  } catch (err) {
    console.error('AI scale error:', err);
    res.status(500).json({ error: 'Failed to get AI scaling suggestions' });
  }
});

module.exports = router;
