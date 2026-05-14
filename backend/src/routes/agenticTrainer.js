// Agentic trainer: "I want to fine-tune GPT-3.5 for customer support" → recommends dataset size, approach, evaluation.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const router = express.Router();

// POST /api/agentic-trainer/recommend { base_model, use_case, budget_usd, target_quality }
router.post('/recommend', authMiddleware, async (req, res) => {
  try {
    const { base_model, use_case, budget_usd, target_quality } = req.body || {};
    if (!base_model || !use_case) return res.status(400).json({ error: 'base_model + use_case required' });
    const system = 'You are an ML fine-tuning advisor. Output JSON {"dataset_size_recommendation":int,"training_approach":"...","eval_metrics":["..."],"estimated_cost":num,"estimated_hours":num,"alternatives":["..."]}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ base_model, use_case, budget_usd, target_quality }) }]);
      parsed = parseAIJson(raw) || { raw };
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }
    return res.json({ base_model, use_case, recommendation: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'recommend failed' });
  }
});

module.exports = router;
