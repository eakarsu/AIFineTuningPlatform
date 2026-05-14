// MECHANICAL: Public model marketplace listing.
// Surfaces custom_models flagged is_public=true (column added lazily) plus
// associated metrics/tags. Read-only listing endpoint plus a publish toggle.
//
// PRODUCT-DECISION: marketplace is metadata-only (no pricing/revenue split).
// Pricing and revenue sharing remain backlog items.

const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

async function ensureMarketplaceColumn() {
  // Add is_public + summary columns to custom_models if they don't exist.
  await db.query(`ALTER TABLE custom_models ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`).catch(() => {});
  await db.query(`ALTER TABLE custom_models ADD COLUMN IF NOT EXISTS marketplace_summary TEXT`).catch(() => {});
}
ensureMarketplaceColumn();

// GET /api/marketplace — list public custom_models
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const search = (req.query.q || '').trim();
    const params = [];
    let where = 'WHERE COALESCE(cm.is_public, FALSE) = TRUE';
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where += ` AND (LOWER(cm.name) LIKE $${params.length} OR LOWER(COALESCE(cm.description,'')) LIKE $${params.length})`;
    }
    params.push(limit, offset);
    const sql = `
      SELECT cm.id, cm.name, cm.description, cm.version, cm.status,
             cm.performance_metrics, cm.endpoint_url, cm.created_at,
             cm.marketplace_summary, cm.base_model_id
      FROM custom_models cm
      ${where}
      ORDER BY cm.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const r = await db.query(sql, params);
    const countR = await db.query(`SELECT COUNT(*) FROM custom_models cm ${where}`, params.slice(0, params.length - 2));
    res.json({ data: r.rows, total: parseInt(countR.rows[0].count, 10) });
  } catch (err) {
    console.error('marketplace list error:', err);
    res.status(500).json({ error: 'Failed to list marketplace' });
  }
});

// GET /api/marketplace/:id — public detail
router.get('/:id', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT cm.*, bm.name AS base_model_name
       FROM custom_models cm
       LEFT JOIN base_models bm ON bm.id = cm.base_model_id
       WHERE cm.id = $1 AND COALESCE(cm.is_public, FALSE) = TRUE`,
      [req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found or not public' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load model' });
  }
});

// POST /api/marketplace/:id/publish — toggle visibility (auth required)
router.post('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const { is_public, marketplace_summary } = req.body || {};
    const r = await db.query(
      `UPDATE custom_models
       SET is_public = COALESCE($1, is_public),
           marketplace_summary = COALESCE($2, marketplace_summary)
       WHERE id = $3
       RETURNING id, name, is_public, marketplace_summary`,
      [typeof is_public === 'boolean' ? is_public : null, marketplace_summary || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Custom model not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('publish error:', err);
    res.status(500).json({ error: 'Failed to publish' });
  }
});

module.exports = router;
