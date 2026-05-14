const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * AI run history (paginated). Closes audit gap #9.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { feature, entity_type, entity_id, status, mine } = req.query;

    const params = [];
    const where = [];
    if (feature) {
      params.push(feature);
      where.push(`feature = $${params.length}`);
    }
    if (entity_type) {
      params.push(entity_type);
      where.push(`entity_type = $${params.length}`);
    }
    if (entity_id) {
      params.push(String(entity_id));
      where.push(`entity_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (mine === 'true' && req.user?.id) {
      params.push(String(req.user.id));
      where.push(`user_id = $${params.length}`);
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS c FROM ai_results ${whereClause}`,
      params
    );
    const total = countResult.rows[0].c;

    params.push(limit);
    params.push(offset);
    const dataResult = await db.query(
      `SELECT * FROM ai_results ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (e) {
    console.error('List ai_results error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM ai_results WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
