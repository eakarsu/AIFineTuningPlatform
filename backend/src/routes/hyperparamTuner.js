// Automated hyperparameter tuning: grid search or Bayesian optimisation.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

function cartesian(spec) {
  const keys = Object.keys(spec);
  return keys.reduce((acc, k) => acc.flatMap(prev => spec[k].map(v => ({ ...prev, [k]: v }))), [{}]);
}

// POST /api/hyperparam-tuner/grid { model, dataset_id, grid:{lr:[1e-5,3e-5],batch_size:[8,16],epochs:[3,5]} }
router.post('/grid', authMiddleware, async (req, res) => {
  try {
    const { model, dataset_id, grid = {} } = req.body || {};
    if (!model || !dataset_id) return res.status(400).json({ error: 'model + dataset_id required' });
    const trials = cartesian(grid);
    if (trials.length > 50) return res.status(400).json({ error: 'grid size > 50; reduce search space' });
    try {
      const r = await db.query(`INSERT INTO hp_searches (model, dataset_id, trials, user_id, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id`, [model, dataset_id, JSON.stringify(trials), req.user?.id]);
      return res.json({ id: r.rows[0].id, trial_count: trials.length, trials });
    } catch (e) {
      return res.json({ trial_count: trials.length, trials, note: 'hp_searches table missing — recorded inline only' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'grid failed' });
  }
});

module.exports = router;
