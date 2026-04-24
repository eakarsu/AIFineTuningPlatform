const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/audit-logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const action = req.query.action;
    const resource_type = req.query.resource_type;

    let query = `SELECT al.*, u.name as user_name, u.email as user_email
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id`;
    let countQuery = 'SELECT COUNT(*) FROM audit_logs al';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (action) {
      conditions.push(`al.action = $${params.length + 1}`);
      params.push(action);
      countParams.push(action);
    }
    if (resource_type) {
      conditions.push(`al.resource_type = $${params.length + 1}`);
      params.push(resource_type);
      countParams.push(resource_type);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    query += ' ORDER BY al.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
    console.error('List audit logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit-logs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get audit log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
