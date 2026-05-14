// NEEDS-CREDS: Hugging Face Hub integration.
// Required env vars:
//   HF_API_KEY  — Hugging Face access token (read-only is sufficient for /search and /info)
//
// When unset every endpoint returns 503 with `missing: HF_API_KEY`.
// When set, this still returns a STUB response — wiring the actual outbound
// HTTP calls to api-inference.huggingface.co is left for a future change so
// we don't add any new dependency or secret-leakage surface in this pass.

const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function gate(res) {
  if (!process.env.HF_API_KEY) {
    res.status(503).json({ error: 'HF_API_KEY not configured', missing: 'HF_API_KEY', hint: 'Set HF_API_KEY in .env to enable Hugging Face integration.' });
    return false;
  }
  return true;
}

router.get('/search', async (req, res) => {
  if (!gate(res)) return;
  const q = (req.query.q || '').trim();
  res.json({
    query: q,
    note: 'STUB response — outbound HF Hub call not yet implemented.',
    results: q ? [
      { id: `${q}-7b`, downloads: 12345, likes: 67, pipeline_tag: 'text-generation' },
      { id: `${q}-13b`, downloads: 9876, likes: 54, pipeline_tag: 'text-generation' },
    ] : [],
  });
});

router.get('/model/:owner/:name', async (req, res) => {
  if (!gate(res)) return;
  const { owner, name } = req.params;
  res.json({
    id: `${owner}/${name}`,
    note: 'STUB response — outbound HF Hub call not yet implemented.',
    config: { architectures: ['LlamaForCausalLM'], hidden_size: 4096 },
    license: 'apache-2.0',
    tags: ['text-generation'],
  });
});

router.post('/import', async (req, res) => {
  if (!gate(res)) return;
  const { hf_id } = req.body || {};
  if (!hf_id) return res.status(400).json({ error: 'hf_id is required' });

  // Best-effort write into base_models if schema permits.
  try {
    const r = await db.query(
      `INSERT INTO base_models (name, provider, description)
       VALUES ($1, 'huggingface', $2)
       RETURNING id, name, provider`,
      [hf_id, `Imported from Hugging Face: ${hf_id} (STUB — metadata not fetched)`]
    );
    res.status(201).json({ imported: r.rows[0], note: 'STUB metadata.' });
  } catch (err) {
    // Schema mismatch fallback — return the synthesized record without persistence.
    res.status(201).json({ imported: { name: hf_id, provider: 'huggingface', persisted: false }, note: 'STUB — base_models insert failed; returning synthetic record.', error: err.message });
  }
});

module.exports = router;
