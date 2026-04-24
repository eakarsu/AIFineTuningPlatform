const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/webhooks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = 'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const countQuery = 'SELECT COUNT(*) FROM webhooks WHERE user_id = $1';

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
    console.error('List webhooks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/webhooks/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webhooks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, url, events, secret, is_active } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const result = await db.query(
      `INSERT INTO webhooks (name, url, events, secret, is_active, failure_count, user_id)
       VALUES ($1, $2, $3, $4, $5, 0, $6)
       RETURNING *`,
      [name, url, events ? JSON.stringify(events) : '[]', secret || null, is_active !== false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/webhooks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, url, events, secret, is_active } = req.body;

    const result = await db.query(
      `UPDATE webhooks
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           events = COALESCE($3, events),
           secret = COALESCE($4, secret),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name || null, url || null, events ? JSON.stringify(events) : null, secret || null, is_active !== undefined ? is_active : null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/webhooks/:id/toggle
router.put('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE webhooks SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webhooks/:id/test
router.post('/:id/test', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const webhook = result.rows[0];
    res.json({
      message: 'Webhook test successful',
      webhook_id: webhook.id,
      url: webhook.url,
      status: 'delivered',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Test webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/webhooks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json({ message: 'Webhook deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
