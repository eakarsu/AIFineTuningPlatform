const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/files/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [totalResult, sizeResult, categoryResult] = await Promise.all([
      db.query('SELECT COUNT(*) FROM files WHERE user_id = $1', [req.user.id]),
      db.query('SELECT COALESCE(SUM(size_bytes), 0) as total_size FROM files WHERE user_id = $1', [req.user.id]),
      db.query('SELECT category, COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as total_size FROM files WHERE user_id = $1 GROUP BY category ORDER BY count DESC', [req.user.id]),
    ]);

    res.json({
      total_files: parseInt(totalResult.rows[0].count),
      total_size_bytes: parseInt(sizeResult.rows[0].total_size),
      by_category: categoryResult.rows,
    });
  } catch (err) {
    console.error('Get file stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/files
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let query = 'SELECT * FROM files';
    let countQuery = 'SELECT COUNT(*) FROM files';
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
    console.error('List files error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/files/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/files
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, original_name, mime_type, size_bytes, path, category, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO files (name, original_name, mime_type, size_bytes, path, category, description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, original_name || null, mime_type || null, size_bytes || 0, path || null, category || null, description || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/files/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, original_name, mime_type, size_bytes, path, category, description } = req.body;

    const result = await db.query(
      `UPDATE files
       SET name = COALESCE($1, name),
           original_name = COALESCE($2, original_name),
           mime_type = COALESCE($3, mime_type),
           size_bytes = COALESCE($4, size_bytes),
           path = COALESCE($5, path),
           category = COALESCE($6, category),
           description = COALESCE($7, description),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name || null, original_name || null, mime_type || null, size_bytes || null, path || null, category || null, description || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM files WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ message: 'File deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
