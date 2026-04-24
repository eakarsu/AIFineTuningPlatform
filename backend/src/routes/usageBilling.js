const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/usage-billing
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const billing_period = req.query.billing_period;
    const resource_type = req.query.resource_type;

    let query = 'SELECT * FROM usage_billing';
    let countQuery = 'SELECT COUNT(*) FROM usage_billing';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (billing_period) {
      conditions.push(`billing_period = $${params.length + 1}`);
      params.push(billing_period);
      countParams.push(billing_period);
    }
    if (resource_type) {
      conditions.push(`resource_type = $${params.length + 1}`);
      params.push(resource_type);
      countParams.push(resource_type);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
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
    console.error('List usage billing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage-billing/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const [totalResult, byTypeResult, byPeriodResult, byUserResult] = await Promise.all([
      db.query('SELECT SUM(tokens_used) as total_tokens, SUM(compute_hours) as total_compute_hours, SUM(cost) as total_cost FROM usage_billing'),
      db.query('SELECT resource_type, SUM(tokens_used) as tokens, SUM(compute_hours) as compute_hours, SUM(cost) as cost, COUNT(*) as count FROM usage_billing GROUP BY resource_type ORDER BY cost DESC'),
      db.query('SELECT billing_period, SUM(tokens_used) as tokens, SUM(compute_hours) as compute_hours, SUM(cost) as cost, COUNT(*) as count FROM usage_billing GROUP BY billing_period ORDER BY billing_period DESC'),
      db.query(`SELECT u.name, u.email, SUM(ub.tokens_used) as tokens, SUM(ub.compute_hours) as compute_hours, SUM(ub.cost) as cost
                FROM usage_billing ub JOIN users u ON ub.user_id = u.id
                GROUP BY u.id, u.name, u.email ORDER BY cost DESC`),
    ]);

    res.json({
      totals: totalResult.rows[0],
      by_resource_type: byTypeResult.rows,
      by_billing_period: byPeriodResult.rows,
      by_user: byUserResult.rows,
    });
  } catch (err) {
    console.error('Usage billing summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage-billing/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usage_billing WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usage billing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get usage billing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
