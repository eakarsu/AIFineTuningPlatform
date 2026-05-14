// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated frontend page (lean v0). Wires Custom Feature Suggestions
// and Gap endpoints (AI counterparts + non-AI features) to backend routes.
import React, { useState } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:4000/api';

const FEATURES = [
  { kind: 'cfs', slug: 'cf-agentic-trainer', label: 'Agentic trainer', desc: '"I want to fine-tune GPT-3.5 for customer support" → agent recommends dataset size, training approach, evaluation metrics', endpoint: '/cf-agentic-trainer' },
  { kind: 'cfs', slug: 'cf-automated-hyperparameter-tuning', label: 'Automated hyperparameter tuning', desc: 'Grid search or Bayesian optimization for parameters', endpoint: '/cf-automated-hyperparameter-tuning' },
  { kind: 'cfs', slug: 'cf-cost-optimization', label: 'Cost optimization', desc: 'Estimate fine-tuning costs, suggest smaller model alternatives', endpoint: '/cf-cost-optimization' },
  { kind: 'cfs', slug: 'cf-model-marketplace', label: 'Model marketplace', desc: 'Share/sell fine-tuned models, revenue sharing', endpoint: '/cf-model-marketplace' },
  { kind: 'cfs', slug: 'cf-one-click-deployment', label: 'One-click deployment', desc: 'Deploy fine-tuned model to production (AWS, Azure, GCP)', endpoint: '/cf-one-click-deployment' },
  { kind: 'cfs', slug: 'cf-monitoring-and-retraining', label: 'Monitoring and retraining', desc: 'Track model drift, recommend retraining', endpoint: '/cf-monitoring-and-retraining' },
  { kind: 'cfs', slug: 'cf-prompt-engineering-tools', label: 'Prompt engineering tools', desc: 'A/B test prompts, measure performance, suggest optimizations', endpoint: '/cf-prompt-engineering-tools' },
  { kind: 'gap-ai', slug: 'gap-ai-only-2-endpoints-exposed-under-ai-js-the-actual-fine-tu', label: 'Only 2 endpoints exposed under `ai*.js` — the actual fine-tu', desc: 'Only 2 endpoints exposed under `ai*.js` — the actual fine-tune kickoff lives in `fineTuningJobs.js` (CRUD) but no AI-recommendation surface', endpoint: '/gap-only-2-endpoints-exposed-under-ai-js-the-actual-fine-tu' },
  { kind: 'gap-ai', slug: 'gap-ai-no-agentic-auto-ml-strategist', label: 'No agentic auto-ML strategist', desc: 'No agentic auto-ML strategist', endpoint: '/gap-no-agentic-auto-ml-strategist' },
  { kind: 'gap-ai', slug: 'gap-ai-no-drift-retraining-recommender', label: 'No drift/retraining recommender', desc: 'No drift/retraining recommender', endpoint: '/gap-no-drift-retraining-recommender' },
  { kind: 'gap-non', slug: 'gap-non-no-native-pytorch-mlflow-direct-connector-beyond-hugging-fac', label: 'No native PyTorch/MLflow direct connector beyond Hugging Fac', desc: 'No native PyTorch/MLflow direct connector beyond Hugging Face', endpoint: '/gap-no-native-pytorch-mlflow-direct-connector-beyond-hugging-fac' },
  { kind: 'gap-non', slug: 'gap-non-no-production-a-b-traffic-split-orchestration-only-prompt-a', label: 'No production A/B traffic-split orchestration (only prompt A', desc: 'No production A/B traffic-split orchestration (only prompt A/B)', endpoint: '/gap-no-production-a-b-traffic-split-orchestration-only-prompt-a' },
  { kind: 'gap-non', slug: 'gap-non-no-deployment-one-click-to-aws-azure-gcp-automation', label: 'No deployment one-click-to-AWS/Azure/GCP automation', desc: 'No deployment one-click-to-AWS/Azure/GCP automation', endpoint: '/gap-no-deployment-one-click-to-aws-azure-gcp-automation' },
];

function authHeaders() {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function Batch03Features() {
  const [active, setActive] = useState(FEATURES[0]?.slug);
  const [input, setInput] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const current = FEATURES.find(f => f.slug === active) || FEATURES[0];

  async function run() {
    if (!current) return;
    setLoading(true); setError(null);
    try {
      let parsed;
      try { parsed = input ? JSON.parse(input) : {}; } catch { parsed = { input }; }
      const r = await fetch(`${API_BASE}${current.endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed)
      });
      let body; try { body = await r.json(); } catch { body = { raw: await r.text() }; }
      if (!r.ok) setError(body.error || `HTTP ${r.status}`);
      setResults(prev => ({ ...prev, [current.slug]: body }));
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Batch 03 Features <small style={{ color: '#64748b', fontWeight: 400 }}>(AIFineTuningPlatform)</small></h2>
      <p style={{ color: '#475569', maxWidth: 720 }}>
        Audit-driven AI counterparts, non-AI feature gaps, and custom feature suggestions.
        Backend endpoints prefixed <code>/api/cf-*</code> (custom features) and <code>/api/gap-*</code> (gap fills).
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {FEATURES.map(f => (
          <button key={f.slug} onClick={() => setActive(f.slug)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1',
                     background: active === f.slug ? '#1e40af' : '#f8fafc',
                     color: active === f.slug ? 'white' : '#0f172a', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ opacity: 0.7, marginRight: 4 }}>[{f.kind}]</span>{f.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{current.label}</strong>
            <div style={{ color: '#475569', fontSize: 13 }}>{current.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>POST <code>{current.endpoint}</code></div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder='Optional JSON input (e.g. {"query":"..."})'
            style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'monospace', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run} disabled={loading}
              style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
          {error && (<div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>{error}</div>)}
          {results[current.slug] && (
            <pre style={{ marginTop: 12, padding: 10, background: '#0b1020', color: '#cbd5e1', borderRadius: 4, overflow: 'auto', maxHeight: 360, fontSize: 12 }}>
              {typeof results[current.slug] === 'string' ? results[current.slug] : JSON.stringify(results[current.slug], null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
