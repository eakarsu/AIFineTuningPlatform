'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDatasetVersion, validateRun, validateArtifact, assertTransition } = require('../src/domain/trainingLifecycle');
const h = (c) => c.repeat(64);

test('dataset requires licensing and distinct split digests', () => {
  assert.doesNotThrow(() => validateDatasetVersion({ dataset_ref: 'ds', version: '1', sha256: h('a'), source: 'object://record', license_attested: true, license_ref: 'license://1', leakage_detected: false, split_manifest: { train_sha256: h('b'), validation_sha256: h('c'), test_sha256: h('d') } }));
  assert.throws(() => validateDatasetVersion({ dataset_ref: 'ds', version: '1', sha256: h('a'), source: 'object://record', license_attested: false, license_ref: 'license://1', leakage_detected: false, split_manifest: { train_sha256: h('b'), validation_sha256: h('c'), test_sha256: h('d') } }), /license/);
});
test('resource caps and artifact bounds are enforced', () => {
  const run = validateRun({ external_ref: 'run', base_model_ref: 'model', recipe: { algorithm: 'lora', config_sha256: h('a'), code_revision: 'abc', random_seed: 1 }, resource_caps: { max_gpu_minutes: 60, max_cost_minor: 5000, max_artifact_bytes: 1000, region: 'local' } });
  assert.equal(run.resource_caps.max_gpu_minutes, 60);
  assert.throws(() => validateArtifact({ registry_ref: 'r', sha256: h('b'), size_bytes: 1001, scan_status: 'clean', model_card_ref: 'm' }, 1000), /size_bytes/);
});
test('approvals are admin-only', () => {
  assert.throws(() => assertTransition('awaiting_training_approval', 'training_approved', 'user'), /admin/);
  assert.doesNotThrow(() => assertTransition('awaiting_training_approval', 'training_approved', 'admin'));
});
