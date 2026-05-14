const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

const router = express.Router();

// Row-level scoping: non-admin users only see their own jobs.
function ownershipFilter(req, params) {
  if (req.user?.role === 'admin') return { clause: '', params };
  params.push(req.user.id);
  return { clause: ` user_id = $${params.length} `, params };
}

// GET /api/fine-tuning-jobs (paginated, scoped)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const where = [];
    let params = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    const own = ownershipFilter(req, params);
    if (own.clause.trim()) where.push(own.clause.trim());
    params = own.params;
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*)::int AS c FROM fine_tuning_jobs ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0].c;

    params.push(limit);
    params.push(offset);
    const dataResult = await db.query(
      `SELECT * FROM fine_tuning_jobs ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('List fine-tuning jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fine-tuning-jobs/:id (scoped)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fine_tuning_jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    if (req.user?.role !== 'admin' && String(result.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
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

// PUT /api/fine-tuning-jobs/:id (scoped)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const owned = await db.query(
      'SELECT user_id FROM fine_tuning_jobs WHERE id = $1',
      [req.params.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    if (req.user?.role !== 'admin' && String(owned.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fine-tuning-jobs/:id (scoped)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const owned = await db.query(
      'SELECT user_id FROM fine_tuning_jobs WHERE id = $1',
      [req.params.id]
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    if (req.user?.role !== 'admin' && String(owned.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await db.query('DELETE FROM fine_tuning_jobs WHERE id = $1 RETURNING id', [req.params.id]);
    res.json({ message: 'Fine-tuning job deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete fine-tuning job error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fine-tuning-jobs/:id/ai-optimize
router.post('/:id/ai-optimize', authMiddleware, async (req, res) => {
  const startedAt = Date.now();
  try {
    const result = await db.query('SELECT * FROM fine_tuning_jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fine-tuning job not found' });
    }
    const job = result.rows[0];
    if (req.user?.role !== 'admin' && String(job.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const prompt = `Analyze the following fine-tuning job and respond with STRICT JSON only.

Job Name: ${job.name}
Description: ${job.description || 'N/A'}
Base Model: ${job.base_model}
Status: ${job.status}
Current Config: ${JSON.stringify(job.config)}
Current Metrics: ${JSON.stringify(job.metrics)}

Return JSON with this shape (no commentary):
{
  "analysis": "string",
  "suggestions": [{ "param": "string", "current": any, "recommended": any, "reason": "string" }],
  "watchouts": ["string"],
  "expected_improvement": "string",
  "alternatives": ["string"]
}`;

    const aiResponse = await callOpenRouter(prompt);
    const parsed = parseAIJson(aiResponse.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'fine_tuning_jobs.ai_optimize',
      user_id: req.user?.id,
      entity_type: 'fine_tuning_job',
      entity_id: job.id,
      input: { config: job.config, metrics: job.metrics },
      output: parsed,
      raw: aiResponse.content,
      model: aiResponse.model,
      tokens_in: aiResponse.usage?.prompt_tokens || null,
      tokens_out: aiResponse.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({
      job_id: job.id,
      optimization_suggestions: aiResponse.content,
      parsed,
      model: aiResponse.model,
      duration_ms: duration,
    });
  } catch (err) {
    console.error('AI optimize error:', err);
    await saveAiResult({
      feature: 'fine_tuning_jobs.ai_optimize',
      user_id: req.user?.id,
      entity_type: 'fine_tuning_job',
      entity_id: req.params.id,
      status: 'failed',
      error: err.message,
      duration_ms: Date.now() - startedAt,
    });
    res.status(500).json({ error: 'Failed to get AI optimization suggestions' });
  }
});

module.exports = router;
