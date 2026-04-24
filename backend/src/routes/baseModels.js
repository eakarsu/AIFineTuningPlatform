const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/base-models
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const provider = req.query.provider;

    let query = 'SELECT * FROM base_models';
    let countQuery = 'SELECT COUNT(*) FROM base_models';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
      countParams.push(category);
    }
    if (provider) {
      conditions.push(`provider = $${params.length + 1}`);
      params.push(provider);
      countParams.push(provider);
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
    console.error('List base models error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/base-models/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM base_models WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base model not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get base model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/base-models
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, provider, description, parameters, context_length, category, capabilities, pricing_per_1k, is_available } = req.body;

    if (!name || !provider) {
      return res.status(400).json({ error: 'Name and provider are required' });
    }

    const result = await db.query(
      `INSERT INTO base_models (name, provider, description, parameters, context_length, category, capabilities, pricing_per_1k, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, provider, description || null, parameters || null, context_length || null, category || null, capabilities ? JSON.stringify(capabilities) : null, pricing_per_1k || null, is_available !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create base model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/base-models/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, provider, description, parameters, context_length, category, capabilities, pricing_per_1k, is_available } = req.body;

    const result = await db.query(
      `UPDATE base_models
       SET name = COALESCE($1, name),
           provider = COALESCE($2, provider),
           description = COALESCE($3, description),
           parameters = COALESCE($4, parameters),
           context_length = COALESCE($5, context_length),
           category = COALESCE($6, category),
           capabilities = COALESCE($7, capabilities),
           pricing_per_1k = COALESCE($8, pricing_per_1k),
           is_available = COALESCE($9, is_available)
       WHERE id = $10
       RETURNING *`,
      [name || null, provider || null, description || null, parameters || null, context_length || null, category || null, capabilities ? JSON.stringify(capabilities) : null, pricing_per_1k || null, is_available != null ? is_available : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base model not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update base model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/base-models/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM base_models WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base model not found' });
    }
    res.json({ message: 'Base model deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete base model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/base-models/ai-recommend
router.post('/ai-recommend', authMiddleware, async (req, res) => {
  try {
    const { use_case, budget, requirements } = req.body;

    const models = await db.query('SELECT name, provider, parameters, context_length, category, capabilities, pricing_per_1k FROM base_models WHERE is_available = true');

    const prompt = `Given the following use case and available models, recommend the best base model for fine-tuning:

Use Case: ${use_case || 'General purpose'}
Budget: ${budget || 'Flexible'}
Requirements: ${requirements || 'No specific requirements'}

Available Models:
${models.rows.map(m => `- ${m.name} (${m.provider}): ${m.parameters} params, ${m.context_length} context, $${m.pricing_per_1k}/1k tokens, capabilities: ${JSON.stringify(m.capabilities)}`).join('\n')}

Please provide:
1. Top 3 recommended models with reasoning
2. Cost-performance analysis
3. Fine-tuning considerations for each
4. Hardware requirements
5. Expected training time estimates`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ recommendations: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI recommend error:', err);
    res.status(500).json({ error: 'Failed to get AI recommendations' });
  }
});

module.exports = router;
