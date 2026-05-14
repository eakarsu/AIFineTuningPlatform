// Cost optimization: estimate fine-tuning costs, suggest smaller-model alternatives.
const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const PRICES = {
  'gpt-4o': { ft_per_1k_tokens: 0.03, smaller: 'gpt-4o-mini' },
  'gpt-4o-mini': { ft_per_1k_tokens: 0.003, smaller: 'gpt-3.5-turbo' },
  'gpt-3.5-turbo': { ft_per_1k_tokens: 0.008, smaller: null },
  'claude-3-5-sonnet': { ft_per_1k_tokens: 0.018, smaller: 'claude-3-5-haiku' },
};

// POST /api/cost-optimization/estimate { model, dataset_tokens, epochs?:3 }
router.post('/estimate', authMiddleware, async (req, res) => {
  try {
    const { model, dataset_tokens, epochs = 3 } = req.body || {};
    if (!model || !dataset_tokens) return res.status(400).json({ error: 'model + dataset_tokens required' });
    const p = PRICES[model];
    if (!p) return res.status(404).json({ error: 'unknown model', supported: Object.keys(PRICES) });
    const cost = (Number(dataset_tokens) / 1000) * p.ft_per_1k_tokens * Number(epochs);
    const alt = p.smaller ? { model: p.smaller, ...PRICES[p.smaller], estimated_cost: (Number(dataset_tokens) / 1000) * (PRICES[p.smaller]?.ft_per_1k_tokens || 0) * Number(epochs) } : null;
    return res.json({ model, estimated_cost_usd: Math.round(cost * 100) / 100, alternative: alt });
  } catch (e) {
    return res.status(500).json({ error: 'estimate failed' });
  }
});

module.exports = router;
