const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const resource_type = req.query.resource_type;

    let query = 'SELECT * FROM favorites WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM favorites WHERE user_id = $1';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (resource_type) {
      query += ' AND resource_type = $2';
      countQuery += ' AND resource_type = $2';
      params.push(resource_type);
      countParams.push(resource_type);
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
    console.error('List favorites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/favorites/check/:resource_type/:resource_id
router.get('/check/:resource_type/:resource_id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3',
      [req.user.id, req.params.resource_type, req.params.resource_id]
    );
    res.json({ is_favorited: result.rows.length > 0, favorite_id: result.rows[0]?.id || null });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/favorites
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { resource_type, resource_id, resource_name } = req.body;

    if (!resource_type || !resource_id) {
      return res.status(400).json({ error: 'resource_type and resource_id are required' });
    }

    const result = await db.query(
      `INSERT INTO favorites (user_id, resource_type, resource_id, resource_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, resource_type, resource_id, resource_name || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create favorite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/favorites/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    res.json({ message: 'Favorite removed', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete favorite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
