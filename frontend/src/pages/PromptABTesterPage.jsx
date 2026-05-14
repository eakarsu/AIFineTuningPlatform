import React, { useState } from 'react';
import api from '../services/api';
import { FiGitBranch, FiCpu, FiAlertCircle } from 'react-icons/fi';

export default function PromptABTesterPage() {
  const [form, setForm] = useState({
    prompt_a: 'You are a helpful assistant. Answer concisely.',
    prompt_b: 'You are an expert assistant. Provide a thorough answer with examples.',
    samples_a: JSON.stringify([
      { prompt_input: 'What is gradient descent?', output: 'A way to find the minimum of a function.', score: 3 },
      { prompt_input: 'Define overfitting.', output: 'When a model memorizes training data.', score: 4 },
    ], null, 2),
    samples_b: JSON.stringify([
      { prompt_input: 'What is gradient descent?', output: 'Iterative optimization that follows the negative gradient...', score: 5 },
      { prompt_input: 'Define overfitting.', output: 'A failure mode where the model fits noise...', score: 4 },
    ], null, 2),
    judge_criteria: 'helpfulness, accuracy, conciseness',
    metric_name: 'quality_score',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let samples_a = [];
      let samples_b = [];
      try { samples_a = JSON.parse(form.samples_a || '[]'); } catch { throw new Error('Invalid JSON in samples_a'); }
      try { samples_b = JSON.parse(form.samples_b || '[]'); } catch { throw new Error('Invalid JSON in samples_b'); }
      const payload = {
        prompt_a: form.prompt_a,
        prompt_b: form.prompt_b,
        samples_a,
        samples_b,
        judge_criteria: form.judge_criteria,
        metric_name: form.metric_name,
      };
      const res = await api.post('/prompt-ab/compare', payload);
      setResult(res.data);
    } catch (err) {
      if (err?.response?.status === 503) {
        setError(err.response.data?.error || 'AI service unavailable (no API key configured)');
      } else {
        setError(err?.response?.data?.error || err.message || 'Comparison failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FiGitBranch /> Prompt A/B Tester
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Compare two prompts on labelled samples. Returns a deterministic Welch t-test approximation for numeric scores
        and an LLM-judge analysis with winner / rationale / next steps.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Inputs</h3>
          <div style={{ marginTop: 12 }}>
            <label>Prompt A</label>
            <textarea value={form.prompt_a} onChange={(e) => handleChange('prompt_a', e.target.value)}
              rows={3} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Samples A (JSON array)</label>
            <textarea value={form.samples_a} onChange={(e) => handleChange('samples_a', e.target.value)}
              rows={5} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Prompt B</label>
            <textarea value={form.prompt_b} onChange={(e) => handleChange('prompt_b', e.target.value)}
              rows={3} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Samples B (JSON array)</label>
            <textarea value={form.samples_b} onChange={(e) => handleChange('samples_b', e.target.value)}
              rows={5} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Judge Criteria</label>
              <input value={form.judge_criteria} onChange={(e) => handleChange('judge_criteria', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Metric Name</label>
              <input value={form.metric_name} onChange={(e) => handleChange('metric_name', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ marginTop: 16, padding: '10px 24px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCpu /> {loading ? 'Comparing...' : 'Run A/B Test'}
          </button>

          {error && (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6, display: 'flex', gap: 8 }}>
              <FiAlertCircle /> {error}
            </div>
          )}
        </form>

        <div style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Result</h3>
          {!result ? (
            <p style={{ color: '#9ca3af' }}>Submit the form to compare prompts.</p>
          ) : (
            <>
              {result.stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <Metric label="Mean A" value={fmt(result.stats.mean_a)} />
                  <Metric label="Mean B" value={fmt(result.stats.mean_b)} />
                  <Metric label="t-stat" value={fmt(result.stats.t_stat)} />
                  <Metric label="Approx p" value={fmt(result.stats.approx_p_value)} />
                </div>
              )}
              {result.judge && (
                <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                  <strong>Winner: {String(result.judge.winner ?? '-')}</strong>
                  {result.judge.rationale && <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{result.judge.rationale}</p>}
                </div>
              )}
              <details style={{ marginTop: 16 }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw Response</summary>
                <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 240 }}>{JSON.stringify(result, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(4) : '-';
  return String(v);
}

function Metric({ label, value }) {
  return (
    <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
