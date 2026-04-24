const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/system-settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const category = req.query.category;

    let query = 'SELECT * FROM system_settings';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('List system settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/system-settings/:key
router.get('/:key', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM system_settings WHERE key = $1', [req.params.key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get system setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/system-settings
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { key, value, category, description } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const result = await db.query(
      `INSERT INTO system_settings (key, value, category, description, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [key, value ? JSON.stringify(value) : null, category || null, description || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create system setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/system-settings/:key
router.put('/:key', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;

    const result = await db.query(
      `UPDATE system_settings
       SET value = $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE key = $3
       RETURNING *`,
      [JSON.stringify(value), req.user.id, req.params.key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update system setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/system-settings/:key
router.delete('/:key', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM system_settings WHERE key = $1 RETURNING key', [req.params.key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ message: 'Setting deleted', key: result.rows[0].key });
  } catch (err) {
    console.error('Delete system setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
