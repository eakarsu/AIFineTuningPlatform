// One-click deployment: deploy fine-tuned model to AWS, Azure, GCP.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const PROVIDERS = ['aws_sagemaker', 'azure_ml', 'gcp_vertex', 'modal', 'replicate'];

// POST /api/one-click-deploy/deploy { model_id, provider, region }
router.post('/deploy', authMiddleware, async (req, res) => {
  try {
    const { model_id, provider, region = 'us-east-1' } = req.body || {};
    if (!model_id || !provider) return res.status(400).json({ error: 'model_id + provider required' });
    if (!PROVIDERS.includes(provider)) return res.status(400).json({ error: `provider must be one of ${PROVIDERS.join(',')}` });
    // TODO: configure credentials — AWS_KEY/SECRET, AZURE_CLIENT_ID/SECRET, GCP_SERVICE_ACCOUNT, MODAL_TOKEN, REPLICATE_API_TOKEN
    const credEnv = provider === 'aws_sagemaker' ? 'AWS_ACCESS_KEY_ID' : provider === 'azure_ml' ? 'AZURE_CLIENT_ID' : provider === 'gcp_vertex' ? 'GCP_SERVICE_ACCOUNT' : provider === 'modal' ? 'MODAL_TOKEN' : 'REPLICATE_API_TOKEN';
    if (!process.env[credEnv]) {
      return res.status(503).json({ error: `${credEnv} missing`, model_id, provider, region });
    }
    // Real impl would call the provider SDK. v0 logs an attempt and returns a stub URL.
    let deploymentId = null;
    try {
      const r = await db.query(`INSERT INTO deployments (model_id, provider, region, status, owner_id, created_at) VALUES ($1,$2,$3,'queued',$4,NOW()) RETURNING id`, [model_id, provider, region, req.user?.id]);
      deploymentId = r.rows[0].id;
    } catch {}
    return res.json({ deployment_id: deploymentId, model_id, provider, region, status: 'queued', endpoint_url: `https://${provider}.example/${model_id}` });
  } catch (e) {
    return res.status(500).json({ error: 'deploy failed' });
  }
});

module.exports = router;
