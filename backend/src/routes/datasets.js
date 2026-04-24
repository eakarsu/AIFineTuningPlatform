const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/datasets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let query = 'SELECT * FROM training_datasets';
    let countQuery = 'SELECT COUNT(*) FROM training_datasets';
    const params = [];
    const countParams = [];

    if (category) {
      query += ' WHERE category = $1';
      countQuery += ' WHERE category = $1';
      params.push(category);
      countParams.push(category);
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
    console.error('List datasets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/datasets/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM training_datasets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
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

// PUT /api/datasets/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/datasets/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM training_datasets WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json({ message: 'Dataset deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete dataset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/datasets/:id/ai-analyze
router.post('/:id/ai-analyze', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM training_datasets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const dataset = result.rows[0];
    const prompt = `Analyze the following training dataset and provide insights:

Dataset Name: ${dataset.name}
Description: ${dataset.description || 'N/A'}
Format: ${dataset.file_format}
Number of Samples: ${dataset.num_samples}
Size: ${dataset.size_mb} MB
Category: ${dataset.category}
Schema: ${JSON.stringify(dataset.schema_info)}

Please provide:
1. Dataset quality assessment
2. Potential issues (class imbalance, data leakage, etc.)
3. Preprocessing recommendations
4. Augmentation suggestions
5. Recommended models for this dataset
6. Expected training time estimates`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ dataset_id: dataset.id, analysis: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI analyze dataset error:', err);
    res.status(500).json({ error: 'Failed to get AI analysis' });
  }
});

module.exports = router;
