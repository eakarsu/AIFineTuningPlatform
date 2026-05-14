const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

/**
 * Prompt A/B Tester with statistical significance estimate.
 * MECHANICAL backlog item from _AUDIT_NOTE.md.
 *
 * POST /api/prompt-ab/compare
 *   body: {
 *     prompt_a: string,
 *     prompt_b: string,
 *     samples_a: [{ prompt_input: string, output: string, score?: number }],
 *     samples_b: [{ prompt_input: string, output: string, score?: number }],
 *     judge_criteria?: string,    // qualitative criteria for the LLM judge
 *     metric_name?: string        // e.g. "helpfulness", "accuracy"
 *   }
 */
router.post('/compare', authMiddleware, aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }

    const {
      prompt_a,
      prompt_b,
      samples_a = [],
      samples_b = [],
      judge_criteria = 'helpfulness, accuracy, conciseness',
      metric_name = 'quality_score',
    } = req.body || {};

    if (!prompt_a || !prompt_b) {
      return res.status(400).json({ error: 'prompt_a and prompt_b are required' });
    }

    // Deterministic stat-sig pre-compute (Welch's t-test approximation)
    const numA = samples_a.map((s) => Number(s.score)).filter((n) => Number.isFinite(n));
    const numB = samples_b.map((s) => Number(s.score)).filter((n) => Number.isFinite(n));
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const variance = (xs, m) => (xs.length > 1 ? xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1) : 0);
    const meanA = mean(numA);
    const meanB = mean(numB);
    let tStat = null;
    let approxP = null;
    if (meanA !== null && meanB !== null && numA.length > 1 && numB.length > 1) {
      const vA = variance(numA, meanA);
      const vB = variance(numB, meanB);
      const se = Math.sqrt(vA / numA.length + vB / numB.length) || 1e-9;
      tStat = (meanA - meanB) / se;
      // Very rough two-sided p-value approximation for moderate sample sizes
      const t = Math.abs(tStat);
      approxP = Math.max(0.0001, Math.min(1, 2 * (1 - (0.5 + 0.5 * Math.tanh(t / 1.5)))));
    }

    const stats = {
      n_a: numA.length,
      n_b: numB.length,
      mean_a: meanA,
      mean_b: meanB,
      t_stat: tStat,
      approx_p_value: approxP,
      significant_at_0_05: approxP !== null ? approxP < 0.05 : null,
    };

    const prompt = `You are an LLM judge for prompt A/B testing. Given two prompts, sample completions from each, and judging criteria, return a structured analysis. Respond ONLY with JSON.

Criteria: ${judge_criteria}
Metric name: ${metric_name}

Prompt A: ${prompt_a}
Samples A: ${JSON.stringify(samples_a).slice(0, 4000)}

Prompt B: ${prompt_b}
Samples B: ${JSON.stringify(samples_b).slice(0, 4000)}

Pre-computed stats: ${JSON.stringify(stats)}

JSON shape:
{
  "winner": "A" | "B" | "tie",
  "judge_score_a": 0,
  "judge_score_b": 0,
  "confidence": 0.0,
  "rationale": "string",
  "qualitative_diff": ["string"],
  "recommendation": "string",
  "next_steps": ["string"]
}`;

    const aiResponse = await callOpenRouter(prompt);
    const parsed = parseAIJson(aiResponse.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'prompt_ab.compare',
      user_id: req.user?.id,
      entity_type: 'prompt_ab',
      entity_id: null,
      input: { prompt_a, prompt_b, samples_a, samples_b, judge_criteria, metric_name },
      output: { stats, judge: parsed || { raw: aiResponse.content } },
      model: aiResponse.model,
      duration_ms: duration,
    }).catch(() => {});

    res.json({
      stats,
      judge: parsed || { raw: aiResponse.content },
      model: aiResponse.model,
      duration_ms: duration,
    });
  } catch (err) {
    if (err && /OPENROUTER_API_KEY/i.test(String(err.message))) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    console.error('Prompt AB compare error:', err);
    res.status(500).json({ error: 'Failed to compare prompts' });
  }
});

module.exports = router;
