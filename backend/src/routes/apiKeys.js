const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { hashKey } = require('../middleware/apiKeyAuth');

const router = express.Router();

function generateApiKey() {
  const prefix = 'aft_';
  const key = crypto.randomBytes(32).toString('hex');
  return { fullKey: prefix + key, prefix: prefix, rawKey: prefix + key };
}

// GET /api/api-keys
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const isAdmin = req.user?.role === 'admin';
    const params = isAdmin ? [] : [req.user.id];
    const where = isAdmin ? '' : 'WHERE user_id = $1';
    const offsetIdx = params.length + 1;
    const [result, countResult] = await Promise.all([
      db.query(
        `SELECT id, name, key_prefix, permissions, rate_limit, is_active, last_used_at, user_id, created_at, expires_at FROM api_keys ${where} ORDER BY created_at DESC LIMIT $${offsetIdx} OFFSET $${offsetIdx + 1}`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) FROM api_keys ${where}`, params),
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
    console.error('List API keys error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/api-keys/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, key_prefix, permissions, rate_limit, is_active, last_used_at, user_id, created_at, expires_at FROM api_keys WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get API key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/api-keys
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, permissions, rate_limit, expires_at } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { fullKey, prefix, rawKey } = generateApiKey();
    // Use SHA256 indexed hash for fast lookup at auth time. The full key is
    // only ever shown once on creation; we never store it in plaintext.
    const keyHash = hashKey(rawKey);

    const result = await db.query(
      `INSERT INTO api_keys (name, key_prefix, key_hash, permissions, rate_limit, is_active, user_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7)
       RETURNING id, name, key_prefix, permissions, rate_limit, is_active, user_id, created_at, expires_at`,
      [name, prefix, keyHash, permissions ? JSON.stringify(permissions) : '["read"]', rate_limit || 1000, req.user.id, expires_at || null]
    );

    // Return the full key only on creation - it won't be retrievable later
    res.status(201).json({
      ...result.rows[0],
      key: fullKey,
      warning: 'Save this key now. It will not be shown again.',
    });
  } catch (err) {
    console.error('Create API key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/api-keys/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, permissions, rate_limit, is_active, expires_at } = req.body;

    const result = await db.query(
      `UPDATE api_keys
       SET name = COALESCE($1, name),
           permissions = COALESCE($2, permissions),
           rate_limit = COALESCE($3, rate_limit),
           is_active = COALESCE($4, is_active),
           expires_at = COALESCE($5, expires_at)
       WHERE id = $6
       RETURNING id, name, key_prefix, permissions, rate_limit, is_active, user_id, created_at, expires_at`,
      [name || null, permissions ? JSON.stringify(permissions) : null, rate_limit || null, is_active != null ? is_active : null, expires_at || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update API key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/api-keys/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM api_keys WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ message: 'API key deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete API key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
