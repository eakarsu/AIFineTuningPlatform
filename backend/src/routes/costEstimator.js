const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

/**
 * Fine-tuning cost estimator — closes audit gap on cost estimation.
 *
 * Provides a deterministic local estimate plus an optional AI-enriched
 * narrative with optimization tips. Inputs are framework-agnostic.
 *
 * POST /api/cost-estimator/estimate
 *   body: {
 *     base_model: string,         // e.g. "meta-llama/llama-3-8b"
 *     dataset_tokens: number,     // total tokens in training set
 *     epochs?: number,            // default 3
 *     hardware?: string,          // e.g. "1x A100 80GB"
 *     hourly_rate?: number,       // USD/hr GPU rate; default 2.0
 *     tokens_per_second?: number, // throughput; default 4000
 *     ai_narrative?: boolean      // if true, ask LLM for cost-reduction tips
 *   }
 */
router.post('/estimate', authMiddleware, aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const {
      base_model,
      dataset_tokens,
      epochs = 3,
      hardware = '1x A100 80GB',
      hourly_rate = 2.0,
      tokens_per_second = 4000,
      ai_narrative = false,
    } = req.body || {};

    if (!base_model || !dataset_tokens) {
      return res.status(400).json({ error: 'base_model and dataset_tokens are required' });
    }

    const tokensTotal = Number(dataset_tokens) * Number(epochs);
    const trainingSeconds = tokensTotal / Math.max(1, Number(tokens_per_second));
    const trainingHours = trainingSeconds / 3600;
    const computeCostUsd = trainingHours * Number(hourly_rate);

    // Apply small overhead factors (data prep, eval, checkpointing)
    const overheadFactor = 1.20;
    const totalCostUsd = parseFloat((computeCostUsd * overheadFactor).toFixed(2));

    const estimate = {
      base_model,
      dataset_tokens: Number(dataset_tokens),
      epochs: Number(epochs),
      hardware,
      hourly_rate: Number(hourly_rate),
      tokens_per_second: Number(tokens_per_second),
      training_hours: parseFloat(trainingHours.toFixed(2)),
      compute_cost_usd: parseFloat(computeCostUsd.toFixed(2)),
      overhead_factor: overheadFactor,
      total_cost_usd: totalCostUsd,
      assumptions: [
        '20% overhead for data prep, evaluation, checkpoint storage.',
        'Throughput tokens/sec is hardware- and framework-dependent; tune for accuracy.',
        'Spot/preemptible instances can cut cost ~50% but add interruption risk.',
      ],
    };

    let narrative = null;
    if (ai_narrative) {
      try {
        const prompt = `You are a machine-learning cost engineer. Given this fine-tuning cost estimate, suggest concrete cost-reduction options without sacrificing too much accuracy. Respond ONLY with JSON.

Estimate: ${JSON.stringify(estimate, null, 2)}

JSON shape:
{
  "tldr": "1-2 sentence narrative",
  "recommendations": [
    { "lever": "string", "expected_savings_pct": 0, "trade_off": "string" }
  ],
  "alternatives": [
    { "approach": "LoRA|QLoRA|Distillation|SmallerBaseModel|FewerEpochs", "estimated_cost_usd": 0, "notes": "string" }
  ]
}`;
        const aiResponse = await callOpenRouter(prompt);
        narrative = { content: aiResponse.content, model: aiResponse.model };
      } catch (aiErr) {
        narrative = { error: 'AI narrative unavailable', detail: aiErr.message };
      }
    }

    const duration = Date.now() - startedAt;
    await saveAiResult({
      feature: 'cost_estimator.estimate',
      user_id: req.user?.id,
      entity_type: 'cost_estimate',
      entity_id: null,
      input: { base_model, dataset_tokens, epochs, hardware, hourly_rate, tokens_per_second, ai_narrative },
      output: { estimate, narrative },
      duration_ms: duration,
    }).catch(() => {});

    res.json({ estimate, narrative, duration_ms: duration });
  } catch (err) {
    console.error('Cost estimate error:', err);
    res.status(500).json({ error: 'Failed to compute cost estimate' });
  }
});

module.exports = router;
