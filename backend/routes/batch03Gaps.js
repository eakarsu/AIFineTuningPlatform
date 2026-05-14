// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-only-2-endpoints-exposed-under-ai-js-the-actual-fine-tu', buildHandler('gap-ai-only-2-endpoints-exposed-under-ai-js-the-actual-fine-tu', 'Only 2 endpoints exposed under `ai*.js` — the actual fine-tu', 'Only 2 endpoints exposed under `ai*.js` — the actual fine-tune kickoff lives in `fineTuningJobs.js` (CRUD) but no AI-recommendation surface'));
router.post('/gap-no-agentic-auto-ml-strategist', buildHandler('gap-ai-no-agentic-auto-ml-strategist', 'No agentic auto-ML strategist', 'No agentic auto-ML strategist'));
router.post('/gap-no-drift-retraining-recommender', buildHandler('gap-ai-no-drift-retraining-recommender', 'No drift/retraining recommender', 'No drift/retraining recommender'));
router.post('/gap-no-native-pytorch-mlflow-direct-connector-beyond-hugging-fac', buildHandler('gap-non-no-native-pytorch-mlflow-direct-connector-beyond-hugging-fac', 'No native PyTorch/MLflow direct connector beyond Hugging Fac', 'No native PyTorch/MLflow direct connector beyond Hugging Face'));
router.post('/gap-no-production-a-b-traffic-split-orchestration-only-prompt-a', buildHandler('gap-non-no-production-a-b-traffic-split-orchestration-only-prompt-a', 'No production A/B traffic-split orchestration (only prompt A', 'No production A/B traffic-split orchestration (only prompt A/B)'));
router.post('/gap-no-deployment-one-click-to-aws-azure-gcp-automation', buildHandler('gap-non-no-deployment-one-click-to-aws-azure-gcp-automation', 'No deployment one-click-to-AWS/Azure/GCP automation', 'No deployment one-click-to-AWS/Azure/GCP automation'));

module.exports = router;
