const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

const router = express.Router();

// GET /api/prompt-templates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let query = 'SELECT * FROM prompt_templates';
    let countQuery = 'SELECT COUNT(*) FROM prompt_templates';
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
    console.error('List prompt templates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/prompt-templates/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM prompt_templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt template not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get prompt template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prompt-templates
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, template_text, variables, example_output, is_public } = req.body;

    if (!name || !template_text) {
      return res.status(400).json({ error: 'Name and template_text are required' });
    }

    const result = await db.query(
      `INSERT INTO prompt_templates (name, description, category, template_text, variables, example_output, is_public, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description || null, category || null, template_text, variables ? JSON.stringify(variables) : null, example_output || null, is_public || false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create prompt template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/prompt-templates/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, template_text, variables, example_output, is_public } = req.body;

    const result = await db.query(
      `UPDATE prompt_templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           template_text = COALESCE($4, template_text),
           variables = COALESCE($5, variables),
           example_output = COALESCE($6, example_output),
           is_public = COALESCE($7, is_public),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name || null, description || null, category || null, template_text || null, variables ? JSON.stringify(variables) : null, example_output || null, is_public != null ? is_public : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt template not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update prompt template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/prompt-templates/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM prompt_templates WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt template not found' });
    }
    res.json({ message: 'Prompt template deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete prompt template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/prompt-templates/ai-generate
router.post('/ai-generate', authMiddleware, async (req, res) => {
  try {
    const { task, description, target_model, examples } = req.body;

    const prompt = `Generate a high-quality prompt template for the following use case:

Task: ${task || 'General purpose'}
Description: ${description || 'Not specified'}
Target Model: ${target_model || 'Any LLM'}
Examples: ${examples || 'None provided'}

Please generate:
1. A well-structured prompt template with placeholders (use {{variable_name}} syntax)
2. List of all variables/placeholders used
3. A system prompt (if applicable)
4. An example of the template filled in with sample data
5. Expected output format
6. Tips for getting best results
7. Variations for different use cases`;

    const aiResponse = await callOpenRouter(prompt);
    res.json({ generated_template: aiResponse.content, model: aiResponse.model });
  } catch (err) {
    console.error('AI generate template error:', err);
    res.status(500).json({ error: 'Failed to generate AI template' });
  }
});

module.exports = router;
