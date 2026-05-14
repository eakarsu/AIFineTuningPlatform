const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { apiKeyOrJwt } = require('../middleware/apiKeyAuth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

/**
 * Inference proxy endpoint — closes audit gap #6 (api_keys table unused).
 *
 * Accepts either JWT (X-API-Key header) or Bearer JWT. Proxies inference
 * through OpenRouter using the deployed model identifier.
 *
 * POST /api/inference/:deploymentId
 *   body: { prompt, system?, max_tokens?, temperature? }
 */
router.post(
  '/:deploymentId',
  apiKeyOrJwt(authMiddleware),
  aiRateLimiter,
  async (req, res) => {
    const startedAt = Date.now();
    try {
      const { deploymentId } = req.params;
      const { prompt, system, max_tokens, temperature } = req.body || {};
      if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
      }

      // Look up the deployment + linked model.
      const dep = await db.query(
        `SELECT d.*, cm.base_model AS underlying_model
           FROM deployments d
           LEFT JOIN custom_models cm ON cm.id = d.model_id
          WHERE d.id = $1`,
        [deploymentId]
      );
      if (dep.rows.length === 0) {
        return res.status(404).json({ error: 'Deployment not found' });
      }
      const deployment = dep.rows[0];
      if (deployment.status !== 'active') {
        return res.status(400).json({ error: `Deployment status is ${deployment.status}` });
      }

      const model = deployment.underlying_model || process.env.OPENROUTER_MODEL;
      const ai = await callOpenRouter(
        prompt,
        system || 'You are a fine-tuned domain expert assistant.',
        { temperature: temperature ?? 0.7, maxTokens: max_tokens ?? 1024, model }
      );
      const duration = Date.now() - startedAt;

      // Track usage in usage_billing table best-effort.
      try {
        await db.query(
          `INSERT INTO usage_billing
              (user_id, deployment_id, request_count, tokens_in, tokens_out, recorded_at)
           VALUES ($1,$2,1,$3,$4,NOW())`,
          [
            req.user?.id,
            deploymentId,
            ai.usage?.prompt_tokens || 0,
            ai.usage?.completion_tokens || 0,
          ]
        );
      } catch (_) {
        /* ignore — table schema may differ */
      }

      await saveAiResult({
        feature: 'inference.invoke',
        user_id: req.user?.id,
        entity_type: 'deployment',
        entity_id: deploymentId,
        input: { prompt: prompt.slice(0, 500), system },
        output: { content: ai.content?.slice(0, 5000) },
        model: ai.model,
        tokens_in: ai.usage?.prompt_tokens || null,
        tokens_out: ai.usage?.completion_tokens || null,
        duration_ms: duration,
      });

      res.json({
        deployment_id: deploymentId,
        model: ai.model,
        content: ai.content,
        usage: ai.usage,
        duration_ms: duration,
        api_key_used: !!req.apiKey,
      });
    } catch (e) {
      console.error('Inference error:', e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;
