const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/tags
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = 'SELECT * FROM tags WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const countQuery = 'SELECT COUNT(*) FROM tags WHERE user_id = $1';

    const [result, countResult] = await Promise.all([
      db.query(query, [req.user.id, limit, offset]),
      db.query(countQuery, [req.user.id]),
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
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tags/resources/:resource_type/:resource_id
router.get('/resources/:resource_type/:resource_id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.* FROM tags t
       INNER JOIN resource_tags rt ON rt.tag_id = t.id
       WHERE rt.resource_type = $1 AND rt.resource_id = $2 AND t.user_id = $3
       ORDER BY t.name ASC`,
      [req.params.resource_type, req.params.resource_id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get tags for resource error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO tags (name, color, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, color || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tags/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;

    const result = await db.query(
      `UPDATE tags
       SET name = COALESCE($1, name),
           color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name || null, color || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Delete associated resource_tags first (cascade)
    await db.query('DELETE FROM resource_tags WHERE tag_id = $1', [req.params.id]);

    const result = await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tags/:id/resources
router.post('/:id/resources', authMiddleware, async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;

    if (!resource_type || !resource_id) {
      return res.status(400).json({ error: 'resource_type and resource_id are required' });
    }

    // Verify tag belongs to user
    const tagResult = await db.query('SELECT id FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (tagResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const result = await db.query(
      `INSERT INTO resource_tags (tag_id, resource_type, resource_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, resource_type, resource_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add tag to resource error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tags/:id/resources
router.delete('/:id/resources', authMiddleware, async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;

    if (!resource_type || !resource_id) {
      return res.status(400).json({ error: 'resource_type and resource_id are required' });
    }

    const result = await db.query(
      'DELETE FROM resource_tags WHERE tag_id = $1 AND resource_type = $2 AND resource_id = $3 RETURNING id',
      [req.params.id, resource_type, resource_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource tag not found' });
    }

    res.json({ message: 'Tag removed from resource', id: result.rows[0].id });
  } catch (err) {
    console.error('Remove tag from resource error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
