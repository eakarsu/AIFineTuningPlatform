import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FiActivity, FiSearch, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function AiResultsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [feature, setFeature] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchResults = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (feature) params.feature = feature;
      if (status) params.status = status;
      const res = await api.get('/ai-results', { params });
      setData(res.data.data || []);
      setPagination(res.data.pagination || pagination);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [feature, status]);

  useEffect(() => { fetchResults(1); }, [fetchResults]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiActivity /> AI Run History
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Filter by feature (e.g. fine_tuning_jobs.ai_optimize)"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="blocked">Blocked</option>
        </select>
        <button onClick={() => fetchResults(1)} style={{ padding: '8px 16px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6 }}>
          <FiSearch /> Search
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Feature</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Entity</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Model</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Tokens</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Duration</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ borderTop: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  <td style={{ padding: 12 }}>{r.id}</td>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 13 }}>{r.feature}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.entity_type}{r.entity_id ? `:${r.entity_id}` : ''}</td>
                  <td style={{ padding: 12 }}>
                    {r.status === 'completed' ? <FiCheckCircle color="#10b981" /> : <FiXCircle color="#ef4444" />}
                    <span style={{ marginLeft: 6 }}>{r.status}</span>
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.model || '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{(r.tokens_in || 0) + (r.tokens_out || 0) || '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.duration_ms ? `${r.duration_ms}ms` : '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No AI runs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <div>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</div>
        <div>
          <button disabled={pagination.page <= 1} onClick={() => fetchResults(pagination.page - 1)} style={{ marginRight: 8 }}>Previous</button>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchResults(pagination.page + 1)}>Next</button>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, padding: 24, maxWidth: 800, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2>AI Result #{selected.id}</h2>
            <p><strong>Feature:</strong> {selected.feature}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            {selected.error && <p style={{ color: '#ef4444' }}><strong>Error:</strong> {selected.error}</p>}
            <h3>Input</h3>
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(selected.input, null, 2)}</pre>
            <h3>Output</h3>
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(selected.output, null, 2)}</pre>
            {selected.raw && (
              <>
                <h3>Raw Response</h3>
                <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>{selected.raw}</pre>
              </>
            )}
            <button onClick={() => setSelected(null)} style={{ marginTop: 16, padding: '8px 16px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 6 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
