import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FiBox, FiSearch, FiUpload } from 'react-icons/fi';

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishId, setPublishId] = useState('');
  const [publishSummary, setPublishSummary] = useState('');
  const [publishMsg, setPublishMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      const r = await api.get(`/marketplace${params.toString() ? '?' + params : ''}`);
      setItems(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch (e) { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const publish = async (e) => {
    e.preventDefault();
    setPublishMsg('');
    try {
      const r = await api.post(`/marketplace/${publishId}/publish`, {
        is_public: true, marketplace_summary: publishSummary || null,
      });
      setPublishMsg(`Published #${r.data.id} (${r.data.name})`);
      setPublishId(''); setPublishSummary('');
      load();
    } catch (err) {
      setPublishMsg(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiBox /> Model Marketplace</h1>
      <p style={{ color: '#6b7280' }}>Browse public custom models. Metadata-only — no pricing or auto-deploy.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or description"
          style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <button onClick={load} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6 }}>
          <FiSearch /> Search
        </button>
      </div>
      <div style={{ marginBottom: 8, color: '#6b7280' }}>{loading ? 'Loading…' : `${total} public model(s)`}</div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Version</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Endpoint</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Summary</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? <tr><td colSpan="5" style={{ padding: 12, color: '#9ca3af' }}>No public models yet — publish one below.</td></tr> :
            items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8 }}>{it.name}</td>
                <td style={{ padding: 8 }}>{it.version}</td>
                <td style={{ padding: 8 }}>{it.status}</td>
                <td style={{ padding: 8 }}><code style={{ fontSize: 11 }}>{it.endpoint_url || '—'}</code></td>
                <td style={{ padding: 8, fontSize: 13 }}>{it.marketplace_summary || it.description || '—'}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiUpload /> Publish a model</h2>
      <form onSubmit={publish} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, maxWidth: 600 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12 }}>Custom Model ID</label>
          <input value={publishId} onChange={(e) => setPublishId(e.target.value)} required
            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12 }}>Marketplace Summary</label>
          <textarea value={publishSummary} onChange={(e) => setPublishSummary(e.target.value)} rows={3}
            style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}>Publish</button>
        {publishMsg && <div style={{ marginTop: 8, color: '#374151' }}>{publishMsg}</div>}
      </form>
    </div>
  );
}
