import React, { useState } from 'react';
import api from '../services/api';
import { FiSearch, FiDownload, FiAlertCircle } from 'react-icons/fi';

export default function HuggingFacePage() {
  const [query, setQuery] = useState('llama');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [importId, setImportId] = useState('');
  const [imported, setImported] = useState(null);

  const search = async () => {
    setError(null);
    try {
      const r = await api.get(`/huggingface/search?q=${encodeURIComponent(query)}`);
      setResults(r.data.results || []);
    } catch (err) {
      setError(err.response?.data || { error: err.message });
      setResults([]);
    }
  };

  const importModel = async () => {
    setError(null);
    setImported(null);
    try {
      const r = await api.post('/huggingface/import', { hf_id: importId });
      setImported(r.data);
    } catch (err) {
      setError(err.response?.data || { error: err.message });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Hugging Face Hub</h1>
      <p style={{ color: '#6b7280' }}>Search and import base models from Hugging Face. Requires <code>HF_API_KEY</code>.</p>

      {error?.missing && (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiAlertCircle /> {error.error} — set <strong>{error.missing}</strong> in <code>.env</code> to enable.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search HF Hub"
          style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <button onClick={search} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiSearch /> Search
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>ID</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Downloads</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Likes</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Pipeline</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? <tr><td colSpan="4" style={{ padding: 12, color: '#9ca3af' }}>No results</td></tr> :
            results.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8 }}>{r.id}</td>
                <td style={{ padding: 8 }}>{r.downloads}</td>
                <td style={{ padding: 8 }}>{r.likes}</td>
                <td style={{ padding: 8 }}>{r.pipeline_tag}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2>Import Model</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={importId} onChange={(e) => setImportId(e.target.value)} placeholder="owner/model-name"
          style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <button onClick={importModel} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiDownload /> Import
        </button>
      </div>
      {imported && (
        <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 12 }}>{JSON.stringify(imported, null, 2)}</pre>
      )}
    </div>
  );
}
