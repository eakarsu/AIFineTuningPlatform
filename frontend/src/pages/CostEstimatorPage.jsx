import React, { useState } from 'react';
import api from '../services/api';
import { FiDollarSign, FiCpu, FiAlertCircle } from 'react-icons/fi';

export default function CostEstimatorPage() {
  const [form, setForm] = useState({
    base_model: 'llama-3-8b',
    dataset_size: 50000,
    epochs: 3,
    batch_size: 16,
    gpu_type: 'A100',
    gpu_count: 1,
    gpu_hourly_rate: 3.5,
    overhead_pct: 15,
    technique: 'lora',
    include_ai_narrative: true
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
      const payload = {
        ...form,
        dataset_size: parseInt(form.dataset_size, 10),
        epochs: parseInt(form.epochs, 10),
        batch_size: parseInt(form.batch_size, 10),
        gpu_count: parseInt(form.gpu_count, 10),
        gpu_hourly_rate: parseFloat(form.gpu_hourly_rate),
        overhead_pct: parseFloat(form.overhead_pct),
      };
      const res = await api.post('/cost-estimator/estimate', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Estimate failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FiDollarSign /> Fine-Tuning Cost Estimator
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Estimate training cost based on dataset size, epochs, and GPU configuration. Optional AI narrative outlines
        cost-reduction levers (LoRA / QLoRA / distillation, etc.).
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
              <label>Technique</label>
              <select value={form.technique} onChange={(e) => handleChange('technique', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="full">Full Fine-Tune</option>
                <option value="lora">LoRA</option>
                <option value="qlora">QLoRA</option>
                <option value="distillation">Distillation</option>
              </select>
            </div>
            <div>
              <label>Dataset Size (rows)</label>
              <input type="number" value={form.dataset_size} onChange={(e) => handleChange('dataset_size', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Epochs</label>
              <input type="number" value={form.epochs} onChange={(e) => handleChange('epochs', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Batch Size</label>
              <input type="number" value={form.batch_size} onChange={(e) => handleChange('batch_size', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>GPU Type</label>
              <select value={form.gpu_type} onChange={(e) => handleChange('gpu_type', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}>
                <option value="A100">A100</option>
                <option value="H100">H100</option>
                <option value="V100">V100</option>
                <option value="L4">L4</option>
                <option value="T4">T4</option>
              </select>
            </div>
            <div>
              <label>GPU Count</label>
              <input type="number" value={form.gpu_count} onChange={(e) => handleChange('gpu_count', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>GPU $/hr</label>
              <input type="number" step="0.01" value={form.gpu_hourly_rate}
                onChange={(e) => handleChange('gpu_hourly_rate', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div>
              <label>Overhead %</label>
              <input type="number" step="0.5" value={form.overhead_pct}
                onChange={(e) => handleChange('overhead_pct', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <input type="checkbox" id="ai" checked={form.include_ai_narrative}
                onChange={(e) => handleChange('include_ai_narrative', e.target.checked)} />
              <label htmlFor="ai">AI cost-reduction narrative</label>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ marginTop: 16, padding: '10px 24px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCpu /> {loading ? 'Estimating...' : 'Estimate Cost'}
          </button>

          {error && (
            <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6, display: 'flex', gap: 8 }}>
              <FiAlertCircle /> {error}
            </div>
          )}
        </form>

        <div style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Estimate</h3>
          {!result ? (
            <p style={{ color: '#9ca3af' }}>Submit the form to compute training cost.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <Metric label="Total Cost" value={result.total_cost !== undefined ? `$${Number(result.total_cost).toLocaleString()}` : '-'} />
                <Metric label="Training Hours" value={result.training_hours || result.hours || '-'} />
                <Metric label="GPU Cost" value={result.gpu_cost !== undefined ? `$${Number(result.gpu_cost).toLocaleString()}` : '-'} />
                <Metric label="Overhead" value={result.overhead_cost !== undefined ? `$${Number(result.overhead_cost).toLocaleString()}` : '-'} />
              </div>
              {result.narrative && (
                <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                  <strong>AI Narrative</strong>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{result.narrative}</p>
                </div>
              )}
              {Array.isArray(result.cost_levers) && result.cost_levers.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <strong>Cost Reduction Levers</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {result.cost_levers.map((lever, i) => (
                      <li key={i}>{typeof lever === 'string' ? lever : (lever.lever || lever.recommendation)}</li>
                    ))}
                  </ul>
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

function Metric({ label, value }) {
  return (
    <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
