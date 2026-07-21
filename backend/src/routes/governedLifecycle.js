'use strict';
const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { validateDatasetVersion, validateRun, validateEvaluation, validateArtifact, assertTransition } = require('../domain/trainingLifecycle');

const router = express.Router();
router.use(auth);
const actor = (req) => Number(req.user.id);
const fail = (res, error) => res.status(/not found/i.test(error.message) ? 404 : /Only admin|distinct|Role/i.test(error.message) ? 403 : 400).json({ error: error.message });
async function audit(client, req, id, event, from, to, detail = {}) {
  await client.query(`INSERT INTO governed_training_audit (run_id,tenant_id,actor_id,actor_role,event_type,from_status,to_status,detail)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, req.user.tenant_id, actor(req), req.user.role, event, from, to, detail]);
}
async function transact(req, res, callback) {
  let client;
  try { client = await db.pool.connect(); await client.query('BEGIN'); const result = await callback(client); await client.query('COMMIT'); return result; }
  catch (error) { if (client) await client.query('ROLLBACK'); return fail(res, error); }
  finally { if (client) client.release(); }
}

router.post('/datasets', async (req, res) => {
  try { const record = validateDatasetVersion(req.body?.dataset_version); const id = crypto.randomUUID();
    const result = await db.query(`INSERT INTO governed_dataset_versions
      (id,tenant_id,dataset_ref,version,sha256,source,license_attested,license_ref,leakage_detected,split_manifest,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [id, req.user.tenant_id, record.dataset_ref, record.version, record.sha256, record.source, record.license_attested, record.license_ref, record.leakage_detected, record.split_manifest, actor(req)]);
    return res.status(201).json(result.rows[0]);
  } catch (error) { return fail(res, error); }
});
router.get('/runs', async (req, res) => {
  try { const result = await db.query('SELECT * FROM governed_training_runs WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 200', [req.user.tenant_id]); return res.json(result.rows); }
  catch (_) { return res.status(500).json({ error: 'Unable to list governed runs' }); }
});
router.get('/runs/:id', async (req, res) => {
  try { const [run, history] = await Promise.all([
    db.query('SELECT * FROM governed_training_runs WHERE id=$1 AND tenant_id=$2', [req.params.id, req.user.tenant_id]),
    db.query('SELECT * FROM governed_training_audit WHERE run_id=$1 AND tenant_id=$2 ORDER BY created_at', [req.params.id, req.user.tenant_id]),
  ]); if (!run.rows[0]) return res.status(404).json({ error: 'Run not found' }); return res.json({ run: run.rows[0], audit: history.rows }); }
  catch (_) { return res.status(500).json({ error: 'Unable to load governed run' }); }
});
router.post('/runs', async (req, res) => {
  try { const run = validateRun(req.body?.run); const datasetId = String(req.body?.dataset_version_id || ''); if (!datasetId) throw new Error('dataset_version_id is required'); const id = crypto.randomUUID();
    return transact(req, res, async (client) => {
      const dataset = await client.query('SELECT id FROM governed_dataset_versions WHERE id=$1 AND tenant_id=$2', [datasetId, req.user.tenant_id]); if (!dataset.rows[0]) throw new Error('Dataset version not found');
      const result = await client.query(`INSERT INTO governed_training_runs
        (id,tenant_id,external_ref,dataset_version_id,base_model_ref,recipe,resource_caps,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [id, req.user.tenant_id, run.external_ref, datasetId, run.base_model_ref, run.recipe, run.resource_caps, actor(req)]);
      await audit(client, req, id, 'run.created', null, 'draft', { dataset_version_id: datasetId, config_sha256: run.recipe.config_sha256 }); return res.status(201).json(result.rows[0]);
    });
  } catch (error) { return fail(res, error); }
});
router.post('/runs/:id/transition', (req, res) => transact(req, res, async (client) => {
  const found = await client.query('SELECT * FROM governed_training_runs WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenant_id]); const run = found.rows[0]; if (!run) throw new Error('Run not found');
  const to = String(req.body?.to || ''); assertTransition(run.status, to, req.user.role);
  let trainingApprover = run.training_approved_by; let execution = run.external_execution; let evaluation = run.evaluation; let artifact = run.artifact; let deploymentApprover = run.deployment_approved_by; let failure = run.failure_reason;
  if (to === 'training_approved') { if (actor(req) === Number(run.created_by)) throw new Error('Training approver must be distinct from creator'); trainingApprover = actor(req); }
  if (to === 'external_execution_recorded') { const value = req.body?.external_execution; if (!value || value.success !== true || typeof value.provider_job_ref !== 'string' || !value.provider_job_ref.trim()) throw new Error('successful external_execution.provider_job_ref is required'); execution = { provider: String(value.provider || '').slice(0, 200), provider_job_ref: value.provider_job_ref.slice(0, 500), success: true, started_at: new Date(value.started_at).toISOString(), completed_at: new Date(value.completed_at).toISOString(), billed_cost_minor: Number(value.billed_cost_minor) }; if (!Number.isSafeInteger(execution.billed_cost_minor) || execution.billed_cost_minor < 0 || execution.billed_cost_minor > Number(run.resource_caps.max_cost_minor)) throw new Error('external billed cost exceeds or violates resource cap'); }
  if (to === 'evaluation_recorded') evaluation = validateEvaluation(req.body?.evaluation);
  if (to === 'artifact_registered') artifact = validateArtifact(req.body?.artifact, Number(run.resource_caps.max_artifact_bytes));
  if (to === 'awaiting_deployment_approval' && !artifact) throw new Error('clean artifact is required');
  if (to === 'deployment_approved') { if (actor(req) === Number(run.created_by) || actor(req) === Number(trainingApprover)) throw new Error('Deployment approver must be distinct from creator and training approver'); deploymentApprover = actor(req); }
  if (to === 'failed') { if (typeof req.body?.reason !== 'string' || !req.body.reason.trim()) throw new Error('reason is required'); failure = req.body.reason.slice(0, 2000); }
  const updated = await client.query(`UPDATE governed_training_runs SET status=$1,training_approved_by=$2,external_execution=$3,evaluation=$4,artifact=$5,deployment_approved_by=$6,failure_reason=$7,version=version+1,updated_at=NOW()
    WHERE id=$8 AND tenant_id=$9 RETURNING *`, [to, trainingApprover, execution, evaluation, artifact, deploymentApprover, failure, req.params.id, req.user.tenant_id]);
  await audit(client, req, req.params.id, 'run.transitioned', run.status, to, { provider_action_invoked: false }); return res.json(updated.rows[0]);
}));

module.exports = router;
