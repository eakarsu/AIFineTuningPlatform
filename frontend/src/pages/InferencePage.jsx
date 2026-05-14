import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlay, FiCloud, FiClock, FiCpu } from 'react-icons/fi';

export default function InferencePage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [prompt, setPrompt] = useState('');
  const [system, setSystem] = useState('');
  const [maxTokens, setMaxTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.7);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/deployments?limit=100').then((res) => {
      setDeployments((res.data?.data || []).filter((d) => d.status === 'active'));
    }).catch(() => {});
  }, []);

  const runInference = async () => {
    if (!selectedDeployment || !prompt) {
      setError('Select a deployment and enter a prompt.');
      return;
    }
    setLoading(true);
    setError('');
    setResponse(null);
    try {
      const res = await api.post(`/inference/${selectedDeployment}`, {
        prompt,
        system: system || undefined,
        max_tokens: parseInt(maxTokens, 10),
        temperature: parseFloat(temperature),
      });
      setResponse(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Inference failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FiCloud /> Model Inference
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Request</h3>
          <label style={{ display: 'block', marginTop: 16, marginBottom: 4 }}>Deployment</label>
          <select value={selectedDeployment} onChange={(e) => setSelectedDeployment(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}>
            <option value="">Select an active deployment...</option>
            {deployments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.environment})</option>
            ))}
          </select>

          <label style={{ display: 'block', marginTop: 16, marginBottom: 4 }}>System Prompt (optional)</label>
          <textarea value={system} onChange={(e) => setSystem(e.target.value)} rows={2} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />

          <label style={{ display: 'block', marginTop: 16, marginBottom: 4 }}>User Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} placeholder="Ask anything..." style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <label>Max Tokens</label>
              <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          </div>

          <button onClick={runInference} disabled={loading} style={{ marginTop: 16, padding: '10px 24px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiPlay /> {loading ? 'Running...' : 'Run Inference'}
          </button>

          {error && <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6 }}>{error}</div>}
        </div>

        <div style={{ background: 'white', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <h3>Response</h3>
          {!response ? (
            <p style={{ color: '#9ca3af' }}>No response yet.</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                <span><FiCpu /> {response.model}</span>
                <span><FiClock /> {response.duration_ms}ms</span>
                {response.usage && <span>Tokens: {response.usage.total_tokens || ((response.usage.prompt_tokens || 0) + (response.usage.completion_tokens || 0))}</span>}
              </div>
              <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>{response.content}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
