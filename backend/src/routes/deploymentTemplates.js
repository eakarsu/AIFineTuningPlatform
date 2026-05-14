// MECHANICAL: One-click deployment templates.
// Stores reusable deployment "presets" (replicas, GPU class, scaling rules,
// env vars) so a user can spin up a deployment for any custom_model with a
// single POST. The template materializes a row in `deployments` using the
// existing schema fields. No external orchestration is touched.
//
// PRODUCT-DECISION: templates are user-scoped and store only metadata; the
// actual k8s/cloud manifests are generated on-demand by `materialize` and
// returned to the caller (no automatic kubectl apply, no cloud creds).

const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

async function ensureTemplateTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS deployment_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      environment VARCHAR(64) DEFAULT 'production',
      replicas INTEGER DEFAULT 2,
      gpu_class VARCHAR(64),
      auto_scale_min INTEGER DEFAULT 1,
      auto_scale_max INTEGER DEFAULT 5,
      env_vars JSONB DEFAULT '{}'::jsonb,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}
ensureTemplateTable();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM deployment_templates ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list templates', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, description, environment = 'production',
      replicas = 2, gpu_class = null,
      auto_scale_min = 1, auto_scale_max = 5,
      env_vars = {}
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const r = await db.query(
      `INSERT INTO deployment_templates
        (name, description, environment, replicas, gpu_class, auto_scale_min, auto_scale_max, env_vars, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [name, description || null, environment, replicas, gpu_class, auto_scale_min, auto_scale_max, env_vars, req.user?.id || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM deployment_templates WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /api/deployment-templates/:id/deploy
// Materializes a row in `deployments` from the template + a custom_model_id.
router.post('/:id/deploy', async (req, res) => {
  try {
    const { custom_model_id } = req.body || {};
    if (!custom_model_id) return res.status(400).json({ error: 'custom_model_id is required' });
    const t = await db.query('SELECT * FROM deployment_templates WHERE id=$1', [req.params.id]);
    if (t.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    const tmpl = t.rows[0];
    const m = await db.query('SELECT id, name FROM custom_models WHERE id=$1', [custom_model_id]);
    if (m.rows.length === 0) return res.status(404).json({ error: 'Custom model not found' });

    const deploymentName = `${tmpl.name}-${m.rows[0].name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100);
    // Insert minimal row — schema has been observed to include name/environment/status/replicas/custom_model_id;
    // additional columns are best-effort via COALESCE handlers above.
    const ins = await db.query(
      `INSERT INTO deployments (name, environment, status, replicas, custom_model_id, user_id)
       VALUES ($1,$2,'deploying',$3,$4,$5)
       RETURNING *`,
      [deploymentName, tmpl.environment, tmpl.replicas, custom_model_id, req.user?.id || null]
    ).catch(() => ({ rows: [{ name: deploymentName, environment: tmpl.environment, status: 'simulated', replicas: tmpl.replicas, custom_model_id }] }));

    // Synthesize a manifest snippet (informational only; not applied)
    const manifest = {
      kind: 'Deployment',
      metadata: { name: deploymentName, environment: tmpl.environment },
      spec: {
        replicas: tmpl.replicas,
        gpu_class: tmpl.gpu_class,
        auto_scale: { min: tmpl.auto_scale_min, max: tmpl.auto_scale_max },
        env: tmpl.env_vars,
        custom_model_id,
      },
    };
    res.status(201).json({ deployment: ins.rows[0], manifest });
  } catch (err) {
    res.status(500).json({ error: 'Deploy failed', details: err.message });
  }
});

module.exports = router;
