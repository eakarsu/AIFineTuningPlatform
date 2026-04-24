const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/training-configs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let query = 'SELECT * FROM training_configs';
    let countQuery = 'SELECT COUNT(*) FROM training_configs';
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
    console.error('List training configs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/training-configs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM training_configs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training config not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get training config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/training-configs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, learning_rate, batch_size, epochs, warmup_steps, optimizer, scheduler, max_seq_length, lora_rank, lora_alpha, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO training_configs (name, description, learning_rate, batch_size, epochs, warmup_steps, optimizer, scheduler, max_seq_length, lora_rank, lora_alpha, category, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [name, description || null, learning_rate || null, batch_size || null, epochs || null, warmup_steps || null, optimizer || null, scheduler || null, max_seq_length || null, lora_rank || null, lora_alpha || null, category || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create training config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/training-configs/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, learning_rate, batch_size, epochs, warmup_steps, optimizer, scheduler, max_seq_length, lora_rank, lora_alpha, category } = req.body;

    const result = await db.query(
      `UPDATE training_configs
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           learning_rate = COALESCE($3, learning_rate),
           batch_size = COALESCE($4, batch_size),
           epochs = COALESCE($5, epochs),
           warmup_steps = COALESCE($6, warmup_steps),
           optimizer = COALESCE($7, optimizer),
           scheduler = COALESCE($8, scheduler),
           max_seq_length = COALESCE($9, max_seq_length),
           lora_rank = COALESCE($10, lora_rank),
           lora_alpha = COALESCE($11, lora_alpha),
           category = COALESCE($12, category),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [name || null, description || null, learning_rate || null, batch_size || null, epochs || null, warmup_steps || null, optimizer || null, scheduler || null, max_seq_length || null, lora_rank || null, lora_alpha || null, category || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training config not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update training config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/training-configs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM training_configs WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training config not found' });
    }
    res.json({ message: 'Training config deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete training config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/training-configs/ai-suggest
router.post('/ai-suggest', authMiddleware, async (req, res) => {
  try {
    const { task_type, model_name, dataset_size, hardware, goals } = req.body;

    const prompt = `Suggest optimal training hyperparameters for the following fine-tuning scenario:

Task Type: ${task_type || 'General fine-tuning'}
Base Model: ${model_name || 'Not specified'}
Dataset Size: ${dataset_size || 'Not specified'} samples
Available Hardware: ${hardware || 'Not specified'}
Goals: ${goals || 'Maximize performance'}

Please provide a detailed configuration with:
1. Learning rate (with warmup schedule)
2. Batch size (considering hardware constraints)
3. Number of epochs
4. Warmup steps
5. Optimizer choice and settings
6. Learning rate scheduler
7. Max sequence length
8. LoRA rank and alpha (if applicable)
9. Gradient accumulation steps
10. Regularization (dropout, weight decay)
11. Reasoning for each choice
12. Alternative configurations for different trade-offs`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ suggestions: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI suggest config error:', err);
    res.status(500).json({ error: 'Failed to get AI suggestions' });
  }
});

module.exports = router;
