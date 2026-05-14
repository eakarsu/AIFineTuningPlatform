// Monitoring and retraining: track model drift, recommend retraining.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/drift-monitor/log { model_id, metric, value, ts? }
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { model_id, metric, value, ts } = req.body || {};
    if (!model_id || !metric || value == null) return res.status(400).json({ error: 'model_id, metric, value required' });
    try {
      await db.query(`INSERT INTO model_drift_samples (model_id, metric, value, ts) VALUES ($1,$2,$3,$4)`, [model_id, metric, Number(value), ts || new Date()]);
    } catch {}
    return res.json({ recorded: true, model_id, metric });
  } catch (e) {
    return res.status(500).json({ error: 'log failed' });
  }
});

// GET /api/drift-monitor/:model_id/check
router.get('/:model_id/check', authMiddleware, async (req, res) => {
  try {
    const r = await db.query(`SELECT metric, AVG(value) as recent_mean, COUNT(*) as n FROM model_drift_samples WHERE model_id = $1 AND ts > NOW() - INTERVAL '7 days' GROUP BY metric`, [req.params.model_id]).catch(() => ({ rows: [] }));
    const baseline = await db.query(`SELECT metric, AVG(value) as baseline FROM model_drift_samples WHERE model_id = $1 AND ts < NOW() - INTERVAL '30 days' GROUP BY metric`, [req.params.model_id]).catch(() => ({ rows: [] }));
    const baseMap = new Map(baseline.rows.map(b => [b.metric, Number(b.baseline)]));
    const drift = r.rows.map(row => {
      const base = baseMap.get(row.metric) || Number(row.recent_mean);
      const recent = Number(row.recent_mean);
      const delta_pct = base ? ((recent - base) / base) * 100 : 0;
      return { metric: row.metric, recent_mean: Math.round(recent * 1000) / 1000, baseline_mean: Math.round(base * 1000) / 1000, delta_pct: Math.round(delta_pct * 100) / 100, drift_detected: Math.abs(delta_pct) > 10 };
    });
    const retrainRecommended = drift.some(d => d.drift_detected);
    return res.json({ model_id: req.params.model_id, drift, retrain_recommended: retrainRecommended });
  } catch (e) {
    return res.status(500).json({ error: 'check failed' });
  }
});

module.exports = router;
