const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const is_read = req.query.is_read;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (is_read !== undefined) {
      const readVal = is_read === 'true';
      query += ' AND is_read = $2';
      countQuery += ' AND is_read = $2';
      params.push(readVal);
      countParams.push(readVal);
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
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING *',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read', count: result.rowCount });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link)
       VALUES ($1, $2, $3, $4, false, $5)
       RETURNING *`,
      [user_id || req.user.id, title, message, type || 'info', link || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
