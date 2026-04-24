const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/comments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const resource_type = req.query.resource_type;
    const resource_id = req.query.resource_id;

    let query = `SELECT c.*, u.name as user_name FROM comments c
                 LEFT JOIN users u ON u.id = c.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) FROM comments WHERE 1=1';
    const params = [];
    const countParams = [];

    if (resource_type) {
      params.push(resource_type);
      countParams.push(resource_type);
      query += ' AND c.resource_type = $' + params.length;
      countQuery += ' AND resource_type = $' + countParams.length;
    }

    if (resource_id) {
      params.push(resource_id);
      countParams.push(resource_id);
      query += ' AND c.resource_id = $' + params.length;
      countQuery += ' AND resource_id = $' + countParams.length;
    }

    query += ' ORDER BY c.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { resource_type, resource_id, content, parent_id } = req.body;

    if (!resource_type || !resource_id || !content) {
      return res.status(400).json({ error: 'resource_type, resource_id, and content are required' });
    }

    const result = await db.query(
      `INSERT INTO comments (user_id, resource_type, resource_id, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, resource_type, resource_id, content, parent_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/comments/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await db.query(
      `UPDATE comments
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not authorized' });
    }
    res.json({ message: 'Comment deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
