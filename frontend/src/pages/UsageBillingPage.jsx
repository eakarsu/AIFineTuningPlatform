import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import { FiArrowLeft, FiDollarSign, FiClock, FiCpu, FiZap, FiTrendingUp } from 'react-icons/fi';

export default function UsageBillingPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchItems(); fetchSummary(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/usage-billing'); setItems(res.data.data || res.data.records || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try { const res = await api.get('/usage-billing/summary'); setSummary(res.data.totals || res.data.summary || res.data); }
    catch { setSummary(null); }
  };

  const filtered = items.filter(i => (i.resource_type || '').toLowerCase().includes(search.toLowerCase()) || (i.billing_period || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => setSelected(null)}><FiArrowLeft /></button>
              <h2 className="detail-title">Usage Record #{selected.id}</h2>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Resource Type</div><div className="detail-field-value">{selected.resource_type}</div></div>
              <div className="detail-field"><div className="detail-field-label">Resource ID</div><div className="detail-field-value">{selected.resource_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">Tokens Used</div><div className="detail-field-value">{selected.tokens_used?.toLocaleString()}</div></div>
              <div className="detail-field"><div className="detail-field-label">Compute Hours</div><div className="detail-field-value">{selected.compute_hours}h</div></div>
              <div className="detail-field"><div className="detail-field-label">Cost</div><div className="detail-field-value" style={{color: '#00d4aa', fontWeight: 600}}>${Number(selected.cost || 0).toFixed(2)}</div></div>
              <div className="detail-field"><div className="detail-field-label">Billing Period</div><div className="detail-field-value">{selected.billing_period}</div></div>
              <div className="detail-field"><div className="detail-field-label">Date</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Usage & Billing</h1><p className="page-subtitle">Track resource usage and costs</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search records..." />
        </div>
      </div>

      {summary && (
        <div className="stats-grid" style={{marginBottom: '24px'}}>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(108,99,255,0.15)', color: '#6c63ff'}}><FiDollarSign /></div>
            <div className="stat-info"><div className="stat-value">${Number(summary.total_cost || 0).toFixed(2)}</div><div className="stat-label">Total Cost</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(0,212,170,0.15)', color: '#00d4aa'}}><FiZap /></div>
            <div className="stat-info"><div className="stat-value">{Number(summary.total_tokens || 0).toLocaleString()}</div><div className="stat-label">Total Tokens</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(255,165,2,0.15)', color: '#ffa502'}}><FiCpu /></div>
            <div className="stat-info"><div className="stat-value">{Number(summary.total_compute_hours || 0).toFixed(1)}h</div><div className="stat-label">Compute Hours</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(255,71,87,0.15)', color: '#ff4757'}}><FiTrendingUp /></div>
            <div className="stat-info"><div className="stat-value">{summary.total_records || items.length}</div><div className="stat-label">Total Records</div></div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiDollarSign /></div><div className="empty-state-text">No usage records</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.resource_type} #{item.resource_id}</div>
                  <div className="card-description">{item.billing_period}</div>
                </div>
                <div style={{color: '#00d4aa', fontWeight: 700, fontSize: '16px'}}>${Number(item.cost || 0).toFixed(2)}</div>
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiZap /> {item.tokens_used?.toLocaleString()} tokens</span>
                <span className="card-meta-item"><FiCpu /> {item.compute_hours}h</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
