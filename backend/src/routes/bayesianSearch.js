const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

/**
 * Bayesian hyperparameter search proposal.
 * MECHANICAL backlog item from _AUDIT_NOTE.md.
 *
 * POST /api/bayesian-search/suggest
 *   body: {
 *     base_model?: string,
 *     task?: string,                 // e.g. "instruction-tune", "classification"
 *     metric?: string,                // e.g. "eval_loss", "accuracy"
 *     metric_direction?: "minimize"|"maximize",
 *     trials?: number,                // default 10
 *     prior_observations?: [{ params: {...}, metric: number }],
 *     search_space?: { param_name: { type: "loguniform|uniform|choice", low?: number, high?: number, choices?: any[] } }
 *   }
 */
router.post('/suggest', authMiddleware, aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }

    const {
      base_model = 'unspecified',
      task = 'instruction-tune',
      metric = 'eval_loss',
      metric_direction = 'minimize',
      trials = 10,
      prior_observations = [],
      search_space = {
        learning_rate: { type: 'loguniform', low: 1e-6, high: 1e-3 },
        batch_size: { type: 'choice', choices: [4, 8, 16, 32] },
        warmup_ratio: { type: 'uniform', low: 0, high: 0.1 },
        weight_decay: { type: 'loguniform', low: 1e-4, high: 1e-1 },
      },
    } = req.body || {};

    const prompt = `You are a Bayesian hyperparameter optimization advisor. Given the search space, prior observations, and target metric, propose the next ${trials} trial points using a Gaussian-Process / Tree-structured Parzen Estimator style of reasoning. Respond ONLY with JSON.

Base model: ${base_model}
Task: ${task}
Metric: ${metric} (${metric_direction})
Search space: ${JSON.stringify(search_space)}
Prior observations: ${JSON.stringify(prior_observations)}

JSON shape:
{
  "rationale": "string explaining the acquisition strategy",
  "next_trials": [
    { "trial": 1, "params": { "learning_rate": 0, "batch_size": 0, "warmup_ratio": 0, "weight_decay": 0 }, "expected_improvement": 0.0, "uncertainty": 0.0 }
  ],
  "best_so_far": { "params": {}, "metric": 0 } | null,
  "stopping_criteria": "string"
}`;

    const aiResponse = await callOpenRouter(prompt);
    const parsed = parseAIJson(aiResponse.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'bayesian_search.suggest',
      user_id: req.user?.id,
      entity_type: 'hp_search',
      entity_id: null,
      input: { base_model, task, metric, metric_direction, trials, prior_observations, search_space },
      output: parsed || { raw: aiResponse.content },
      model: aiResponse.model,
      duration_ms: duration,
    }).catch(() => {});

    res.json({
      suggestion: parsed || { raw: aiResponse.content },
      model: aiResponse.model,
      duration_ms: duration,
    });
  } catch (err) {
    if (err && /OPENROUTER_API_KEY/i.test(String(err.message))) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    console.error('Bayesian search error:', err);
    res.status(500).json({ error: 'Failed to compute Bayesian suggestion' });
  }
});

module.exports = router;
