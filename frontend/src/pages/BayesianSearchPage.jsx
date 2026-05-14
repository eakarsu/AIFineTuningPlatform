import React, { useState } from 'react';
import api from '../services/api';
import { FiTarget, FiCpu, FiAlertCircle } from 'react-icons/fi';

export default function BayesianSearchPage() {
  const [form, setForm] = useState({
    base_model: 'llama-3-8b',
    task: 'instruction-tune',
    metric: 'eval_loss',
    metric_direction: 'minimize',
    trials: 5,
    prior_observations: '[]',
    search_space: JSON.stringify({
      learning_rate: { type: 'loguniform', low: 1e-6, high: 1e-3 },
      batch_size: { type: 'choice', choices: [4, 8, 16, 32] },
      warmup_ratio: { type: 'uniform', low: 0, high: 0.1 },
      weight_decay: { type: 'loguniform', low: 1e-4, high: 1e-1 },
    }, null, 2),
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
      let prior_observations = [];
      let search_space = {};
      try { prior_observations = JSON.parse(form.prior_observations || '[]'); } catch { throw new Error('Invalid JSON in prior_observations'); }
      try { search_space = JSON.parse(form.search_space || '{}'); } catch { throw new Error('Invalid JSON in search_space'); }

      const payload = {
        base_model: form.base_model,
        task: form.task,
        metric: form.metric,
        metric_direction: form.metric_direction,
        trials: parseInt(form.trials, 10) || 5,
        prior_observations,
        search_space,
      };
      const res = await api.post('/bayesian-search/suggest', payload);
      setResult(res.data);
    } catch (err) {
      if (err?.response?.status === 503) {
        setError(err.response.data?.error || 'AI service unavailable (no API key configured)');
      } else {
        setError(err?.response?.data?.error || err.message || 'Suggestion failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FiTarget /> Bayesian Hyperparameter Search
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Propose next-best trial points using a Gaussian-Process / TPE-style acquisition strategy. Provide prior observations
        and a search space; the LLM returns candidate hyperparameter trials with expected-improvement scores.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Inputs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Base Model</label>
              <input value={form.base_model} onChange={(e) => handleChange('base_model', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Task</label>
              <input value={form.task} onChange={(e) => handleChange('task', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Metric</label>
              <input value={form.metric} onChange={(e) => handleChange('metric', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Direction</label>
              <select value={form.metric_direction} onChange={(e) => handleChange('metric_direction', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="minimize">Minimize</option>
                <option value="maximize">Maximize</option>
              </select>
            </div>
            <div>
              <label>Trials</label>
              <input type="number" value={form.trials} onChange={(e) => handleChange('trials', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Search Space (JSON)</label>
            <textarea value={form.search_space} onChange={(e) => handleChange('search_space', e.target.value)}
              rows={6} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Prior Observations (JSON array)</label>
            <textarea value={form.prior_observations} onChange={(e) => handleChange('prior_observations', e.target.value)}
              rows={4} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}
              placeholder='[{"params":{"learning_rate":3e-5,"batch_size":16},"metric":1.21}]' />
          </div>

          <button type="submit" disabled={loading}
            style={{ marginTop: 16, padding: '10px 24px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCpu /> {loading ? 'Suggesting...' : 'Suggest Next Trials'}
          </button>

          {error && (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6, display: 'flex', gap: 8 }}>
              <FiAlertCircle /> {error}
            </div>
          )}
        </form>

        <div style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Suggestions</h3>
          {!result ? (
            <p style={{ color: '#9ca3af' }}>Submit the form to receive suggested trial points.</p>
          ) : (
            <>
              {result.suggestion?.rationale && (
                <div style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                  <strong>Rationale</strong>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{result.suggestion.rationale}</p>
                </div>
              )}
              {Array.isArray(result.suggestion?.next_trials) && (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>#</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>Params</th>
                      <th style={{ padding: 6, textAlign: 'left' }}>EI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.suggestion.next_trials.map((t, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: 6 }}>{t.trial ?? i + 1}</td>
                        <td style={{ padding: 6 }}><code>{JSON.stringify(t.params)}</code></td>
                        <td style={{ padding: 6 }}>{t.expected_improvement ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
