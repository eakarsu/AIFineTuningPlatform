import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import { FiArrowLeft, FiShield, FiClock, FiUser, FiActivity } from 'react-icons/fi';

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/audit-logs'); setItems(res.data.data || res.data.logs || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const getActionColor = (action) => {
    if (!action) return '#a0a0b8';
    if (action.includes('create') || action.includes('register')) return '#00d4aa';
    if (action.includes('delete') || action.includes('revoke')) return '#ff4757';
    if (action.includes('update') || action.includes('edit')) return '#ffa502';
    if (action.includes('login') || action.includes('deploy')) return '#6c63ff';
    return '#a0a0b8';
  };

  const filtered = items.filter(i => (i.action || '').toLowerCase().includes(search.toLowerCase()) || (i.resource_type || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => setSelected(null)}><FiArrowLeft /></button>
              <h2 className="detail-title">Audit Log #{selected.id}</h2>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Action</div><div className="detail-field-value" style={{color: getActionColor(selected.action), fontWeight: 600}}>{selected.action}</div></div>
              <div className="detail-field"><div className="detail-field-label">Resource Type</div><div className="detail-field-value">{selected.resource_type}</div></div>
              <div className="detail-field"><div className="detail-field-label">Resource ID</div><div className="detail-field-value">{selected.resource_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">User ID</div><div className="detail-field-value">{selected.user_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">IP Address</div><div className="detail-field-value" style={{fontFamily: 'monospace'}}>{selected.ip_address || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Timestamp</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field" style={{gridColumn: '1 / -1'}}><div className="detail-field-label">Details</div><div className="detail-field-value">{selected.details ? (typeof selected.details === 'object' ? JSON.stringify(selected.details, null, 2) : selected.details) : 'No details'}</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">Activity and security logs</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search logs..." />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiShield /></div><div className="empty-state-text">No audit logs</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title" style={{color: getActionColor(item.action)}}>{item.action}</div>
                  <div className="card-description">{item.resource_type} #{item.resource_id}</div>
                </div>
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiUser /> User #{item.user_id}</span>
                <span className="card-meta-item"><FiActivity /> {item.ip_address || 'N/A'}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
