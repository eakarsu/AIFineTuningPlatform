// Model marketplace: share / sell fine-tuned models, revenue sharing.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/marketplace-listing/list { model_id, price_per_token_usd, description, revenue_share_pct? }
router.post('/list', authMiddleware, async (req, res) => {
  try {
    const { model_id, price_per_token_usd, description, revenue_share_pct = 0.7 } = req.body || {};
    if (!model_id || price_per_token_usd == null) return res.status(400).json({ error: 'model_id + price_per_token_usd required' });
    try {
      const r = await db.query(
        `INSERT INTO marketplace_listings (model_id, owner_id, price_per_token_usd, description, revenue_share_pct, status, created_at) VALUES ($1,$2,$3,$4,$5,'active',NOW()) RETURNING id`,
        [model_id, req.user?.id, Number(price_per_token_usd), description || null, Number(revenue_share_pct)]
      );
      return res.json({ id: r.rows[0].id, model_id, status: 'active' });
    } catch (e) {
      return res.status(500).json({ error: 'marketplace_listings table missing' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'list failed' });
  }
});

// GET /api/marketplace-listing/search?max_price=&q=
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const max = req.query.max_price ? Number(req.query.max_price) : null;
    const q = req.query.q;
    const where = ['status = $1'];
    const params = ['active'];
    if (max != null) { where.push(`price_per_token_usd <= $${params.push(max)}`); }
    if (q) { where.push(`description ILIKE $${params.push(`%${q}%`)}`); }
    const r = await db.query(`SELECT * FROM marketplace_listings WHERE ${where.join(' AND ')} LIMIT 50`, params).catch(() => ({ rows: [] }));
    return res.json({ count: r.rows.length, listings: r.rows });
  } catch (e) {
    return res.status(500).json({ error: 'search failed' });
  }
});

module.exports = router;
