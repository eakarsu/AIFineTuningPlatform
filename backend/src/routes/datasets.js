const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

const router = express.Router();

function ownershipFilter(req, params) {
  if (req.user?.role === 'admin') return { clause: '', params };
  params.push(req.user.id);
  return { clause: ` user_id = $${params.length} `, params };
}

// GET /api/datasets (paginated, scoped)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const category = req.query.category;

    const where = [];
    let params = [];
    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    const own = ownershipFilter(req, params);
    if (own.clause.trim()) where.push(own.clause.trim());
    params = own.params;
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS c FROM training_datasets ${whereClause}`,
      params
    );
    const total = countResult.rows[0].c;

    params.push(limit);
    params.push(offset);
    const dataResult = await db.query(
      `SELECT * FROM training_datasets ${whereClause}
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
    console.error('List datasets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/datasets/:id (scoped)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM training_datasets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    if (req.user?.role !== 'admin' && String(result.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/datasets
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, file_format, num_samples, size_mb, category, schema_info } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.query(
      `INSERT INTO training_datasets (name, description, file_format, num_samples, size_mb, category, status, schema_info, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'uploading', $7, $8)
       RETURNING *`,
      [name, description || null, file_format || null, num_samples || 0, size_mb || 0, category || null, schema_info ? JSON.stringify(schema_info) : null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/datasets/:id (scoped)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const owned = await db.query('SELECT user_id FROM training_datasets WHERE id = $1', [req.params.id]);
    if (owned.rows.length === 0) return res.status(404).json({ error: 'Dataset not found' });
    if (req.user?.role !== 'admin' && String(owned.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, description, file_format, num_samples, size_mb, category, status, schema_info } = req.body;
    const result = await db.query(
      `UPDATE training_datasets
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           file_format = COALESCE($3, file_format),
           num_samples = COALESCE($4, num_samples),
           size_mb = COALESCE($5, size_mb),
           category = COALESCE($6, category),
           status = COALESCE($7, status),
           schema_info = COALESCE($8, schema_info),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name || null, description || null, file_format || null, num_samples || null, size_mb || null, category || null, status || null, schema_info ? JSON.stringify(schema_info) : null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/datasets/:id (scoped)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const owned = await db.query('SELECT user_id FROM training_datasets WHERE id = $1', [req.params.id]);
    if (owned.rows.length === 0) return res.status(404).json({ error: 'Dataset not found' });
    if (req.user?.role !== 'admin' && String(owned.rows[0].user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await db.query('DELETE FROM training_datasets WHERE id = $1 RETURNING id', [req.params.id]);
    res.json({ message: 'Dataset deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/datasets/:id/ai-analyze
router.post('/:id/ai-analyze', authMiddleware, async (req, res) => {
  const startedAt = Date.now();
  try {
    const result = await db.query('SELECT * FROM training_datasets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    const dataset = result.rows[0];
    if (req.user?.role !== 'admin' && String(dataset.user_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const prompt = `Analyze the following training dataset. Respond with STRICT JSON only.

Dataset Name: ${dataset.name}
Description: ${dataset.description || 'N/A'}
Format: ${dataset.file_format}
Number of Samples: ${dataset.num_samples}
Size: ${dataset.size_mb} MB
Category: ${dataset.category}
Schema: ${JSON.stringify(dataset.schema_info)}

Return JSON of shape:
{
  "quality_assessment": "string",
  "issues": ["string"],
  "preprocessing": ["string"],
  "augmentation": ["string"],
  "recommended_models": ["string"],
  "training_time_estimate": "string"
}`;

    const aiResponse = await callOpenRouter(prompt);
    const parsed = parseAIJson(aiResponse.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'datasets.ai_analyze',
      user_id: req.user?.id,
      entity_type: 'training_dataset',
      entity_id: dataset.id,
      input: { num_samples: dataset.num_samples, category: dataset.category },
      output: parsed,
      raw: aiResponse.content,
      model: aiResponse.model,
      tokens_in: aiResponse.usage?.prompt_tokens || null,
      tokens_out: aiResponse.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({
      dataset_id: dataset.id,
      analysis: aiResponse.content,
      parsed,
      model: aiResponse.model,
      duration_ms: duration,
    });
  } catch (err) {
    console.error('AI analyze dataset error:', err);
    await saveAiResult({
      feature: 'datasets.ai_analyze',
      user_id: req.user?.id,
      entity_type: 'training_dataset',
      entity_id: req.params.id,
      status: 'failed',
      error: err.message,
      duration_ms: Date.now() - startedAt,
    });
    res.status(500).json({ error: 'Failed to get AI analysis' });
  }
});

module.exports = router;
