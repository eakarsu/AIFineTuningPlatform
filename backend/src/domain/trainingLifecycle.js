'use strict';

const STATES = Object.freeze([
  'draft', 'awaiting_training_approval', 'training_approved', 'external_execution_recorded',
  'evaluation_recorded', 'artifact_registered', 'awaiting_deployment_approval',
  'deployment_approved', 'closed', 'failed',
]);
const TRANSITIONS = Object.freeze({
  draft: ['awaiting_training_approval', 'failed'],
  awaiting_training_approval: ['training_approved', 'draft', 'failed'],
  training_approved: ['external_execution_recorded', 'failed'],
  external_execution_recorded: ['evaluation_recorded', 'failed'],
  evaluation_recorded: ['artifact_registered', 'failed'],
  artifact_registered: ['awaiting_deployment_approval', 'failed'],
  awaiting_deployment_approval: ['deployment_approved', 'artifact_registered', 'failed'],
  deployment_approved: ['closed', 'failed'],
  failed: ['draft', 'closed'], closed: [],
});

function text(value, name, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${name} is invalid`);
  return value.trim();
}
function sha256(value, name) {
  const digest = String(value || '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error(`${name} is invalid`);
  return digest;
}
function safeInteger(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${name} is invalid`);
  return value;
}
function validateDatasetVersion(input) {
  if (!input || typeof input !== 'object') throw new Error('dataset_version is required');
  if (input.license_attested !== true) throw new Error('dataset license attestation is required');
  if (input.leakage_detected !== false) throw new Error('dataset leakage must be explicitly recorded as false');
  const split = input.split_manifest;
  if (!split || typeof split !== 'object') throw new Error('split_manifest is required');
  const hashes = ['train_sha256','validation_sha256','test_sha256'].map((key) => sha256(split[key], key));
  if (new Set(hashes).size !== hashes.length) throw new Error('train, validation, and test split digests must be distinct');
  return {
    dataset_ref: text(input.dataset_ref, 'dataset_ref', 200),
    version: text(input.version, 'version', 100),
    sha256: sha256(input.sha256, 'sha256'),
    source: text(input.source, 'source', 500),
    license_attested: true,
    license_ref: text(input.license_ref, 'license_ref', 500),
    leakage_detected: false,
    split_manifest: { train_sha256: hashes[0], validation_sha256: hashes[1], test_sha256: hashes[2] },
  };
}
function validateRun(input) {
  if (!input || typeof input !== 'object') throw new Error('run is required');
  const caps = input.resource_caps;
  if (!caps || typeof caps !== 'object') throw new Error('resource_caps is required');
  return {
    external_ref: text(input.external_ref, 'external_ref', 200),
    base_model_ref: text(input.base_model_ref, 'base_model_ref', 500),
    recipe: {
      algorithm: text(input.recipe?.algorithm, 'recipe.algorithm', 100),
      config_sha256: sha256(input.recipe?.config_sha256, 'recipe.config_sha256'),
      code_revision: text(input.recipe?.code_revision, 'recipe.code_revision', 200),
      random_seed: safeInteger(input.recipe?.random_seed, 'recipe.random_seed', 0, 2147483647),
    },
    resource_caps: {
      max_gpu_minutes: safeInteger(caps.max_gpu_minutes, 'max_gpu_minutes', 1, 600000),
      max_cost_minor: safeInteger(caps.max_cost_minor, 'max_cost_minor', 1, 1000000000),
      max_artifact_bytes: safeInteger(caps.max_artifact_bytes, 'max_artifact_bytes', 1, Number.MAX_SAFE_INTEGER),
      region: text(caps.region, 'resource_caps.region', 100),
    },
  };
}
function validateEvaluation(input) {
  if (!input || typeof input !== 'object') throw new Error('evaluation is required');
  if (input.safety_passed !== true || input.leakage_detected !== false) throw new Error('safety must pass and leakage must be false');
  if (!input.metrics || typeof input.metrics !== 'object' || Object.keys(input.metrics).length === 0) throw new Error('evaluation metrics are required');
  for (const value of Object.values(input.metrics)) if (!Number.isFinite(Number(value))) throw new Error('evaluation metric values must be numeric');
  return { suite_ref: text(input.suite_ref, 'suite_ref', 500), metrics: input.metrics, safety_passed: true, leakage_detected: false, report_sha256: sha256(input.report_sha256, 'report_sha256') };
}
function validateArtifact(input, maxBytes) {
  if (!input || typeof input !== 'object') throw new Error('artifact is required');
  const size = safeInteger(input.size_bytes, 'size_bytes', 1, maxBytes);
  if (input.scan_status !== 'clean') throw new Error('artifact scan status must be clean');
  return { registry_ref: text(input.registry_ref, 'registry_ref', 500), sha256: sha256(input.sha256, 'sha256'), size_bytes: size, scan_status: 'clean', model_card_ref: text(input.model_card_ref, 'model_card_ref', 500) };
}
function assertTransition(from, to, role) {
  if (!STATES.includes(from) || !STATES.includes(to) || !(TRANSITIONS[from] || []).includes(to)) throw new Error(`Transition ${from} -> ${to} is not allowed`);
  if (!['user','admin'].includes(role)) throw new Error('Role cannot change lifecycle state');
  if (['training_approved','deployment_approved'].includes(to) && role !== 'admin') throw new Error('Only admin may approve training or deployment');
}

module.exports = { STATES, TRANSITIONS, validateDatasetVersion, validateRun, validateEvaluation, validateArtifact, assertTransition };
