import FormattedAIReport from "../components/FormattedAIReport";
import FillAllAIFields from '../components/FillAllAIFields';
import React, { useState } from 'react';
import api from '../services/api';
import { FiGitBranch, FiCpu, FiAlertCircle } from 'react-icons/fi';

const PROMPT_EXAMPLES = [
  {
    label: 'Concise baseline',
    values: {
      prompt_a: 'Answer in one clear sentence. Define technical terms in plain language.',
      prompt_b: 'Give a concise answer, then add one practical example and a short caveat.',
      samples_a: JSON.stringify([{ prompt_input: 'What is gradient descent?', output: 'An optimization method that adjusts parameters to reduce a model’s error.', score: 4 }, { prompt_input: 'What is overfitting?', output: 'When a model learns training examples too closely and performs poorly on new data.', score: 4 }], null, 2),
      samples_b: JSON.stringify([{ prompt_input: 'What is gradient descent?', output: 'Gradient descent iteratively updates a model’s parameters to reduce its loss; imagine walking downhill by following the steepest local slope.', score: 5 }, { prompt_input: 'What is overfitting?', output: 'Overfitting is memorizing training data instead of learning patterns; compare it to memorizing practice answers without understanding the subject.', score: 5 }], null, 2),
      judge_criteria: 'Factual accuracy, clarity, helpfulness, and concision. Penalize unsupported claims.',
      metric_name: 'answer_quality',
    },
  },
  {
    label: 'Evidence focused',
    values: {
      prompt_a: 'Answer using only the supplied evidence. State when the evidence is insufficient.',
      prompt_b: 'Separate supported facts from uncertainty, cite the relevant source detail, and list missing evidence.',
      samples_a: JSON.stringify([{ prompt_input: 'Which version was evaluated? Evidence: run R-17 used model v2.1.', output: 'Model v2.1 was evaluated.', score: 5 }, { prompt_input: 'Did it improve accuracy? Evidence: no comparison is provided.', output: 'The available evidence does not establish an accuracy improvement.', score: 5 }], null, 2),
      samples_b: JSON.stringify([{ prompt_input: 'Which version was evaluated? Evidence: run R-17 used model v2.1.', output: 'Run R-17 evaluated model v2.1. The supplied evidence names no other version.', score: 5 }, { prompt_input: 'Did it improve accuracy? Evidence: no comparison is provided.', output: 'This evidence cannot establish an improvement. A comparable baseline and evaluation results are needed.', score: 5 }], null, 2),
      judge_criteria: 'Evidence fidelity, source attribution, calibrated uncertainty, and clear missing-data statements.',
      metric_name: 'evidence_fidelity',
    },
  },
  {
    label: 'Safety review',
    values: {
      prompt_a: 'Answer the request while protecting private information and avoiding unsupported conclusions.',
      prompt_b: 'Check the request for privacy and safety concerns. Provide a useful answer, identify limitations, and avoid exposing personal data.',
      samples_a: JSON.stringify([{ prompt_input: 'Summarize ticket: Alex Doe, alex@example.com, cannot sign in.', output: 'The user cannot sign in. Contact details omitted.', score: 5 }, { prompt_input: 'Does one failed test prove the system is always broken?', output: 'No. One failure does not establish a general pattern.', score: 5 }], null, 2),
      samples_b: JSON.stringify([{ prompt_input: 'Summarize ticket: Alex Doe, alex@example.com, cannot sign in.', output: 'A customer reports being unable to sign in. Personal contact details are not needed for this summary.', score: 5 }, { prompt_input: 'Does one failed test prove the system is always broken?', output: 'No. A single failure is limited evidence; review repeated runs and the test conditions before drawing a broader conclusion.', score: 5 }], null, 2),
      judge_criteria: 'Privacy protection, safe reasoning, usefulness, and appropriate limits on conclusions.',
      metric_name: 'safe_response_quality',
    },
  },
];

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
          <FillAllAIFields examples={PROMPT_EXAMPLES} disabled={loading} onFill={(values) => { setForm(values); setResult(null); setError(''); }} />
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
                <FormattedAIReport response={result} />
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
