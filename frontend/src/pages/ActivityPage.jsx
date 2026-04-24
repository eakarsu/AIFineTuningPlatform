import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiActivity, FiPlus, FiEdit2, FiTrash2, FiLogIn, FiClock, FiUser, FiFilter } from 'react-icons/fi';

const actionColors = {
  create: '#00d4aa',
  update: '#6c63ff',
  delete: '#ff4757',
  login: '#a855f7',
};

const actionIcons = {
  create: <FiPlus />,
  update: <FiEdit2 />,
  delete: <FiTrash2 />,
  login: <FiLogIn />,
};

const getActionType = (action) => {
  if (!action) return 'default';
  if (action.includes('create') || action.includes('register') || action.includes('add')) return 'create';
  if (action.includes('update') || action.includes('edit') || action.includes('modify')) return 'update';
  if (action.includes('delete') || action.includes('remove') || action.includes('revoke')) return 'delete';
  if (action.includes('login') || action.includes('auth') || action.includes('deploy')) return 'login';
  return 'default';
};

export default function ActivityPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setItems([]); setPage(1); setHasMore(true); fetchItems(1, true); }, [filterAction, filterDateFrom, filterDateTo]);

  const fetchItems = async (pageNum = 1, reset = false) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      let url = `/audit-logs?page=${pageNum}&limit=20`;
      if (filterAction) url += `&action=${encodeURIComponent(filterAction)}`;
      if (filterDateFrom) url += `&from=${encodeURIComponent(filterDateFrom)}`;
      if (filterDateTo) url += `&to=${encodeURIComponent(filterDateTo)}`;
      const res = await api.get(url);
      const data = res.data.data || res.data.logs || res.data || [];
      const newItems = Array.isArray(data) ? data : [];
      if (reset) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      setHasMore(newItems.length >= 20);
    } catch {
      if (reset) setItems([]);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-subtitle">Recent activity across the platform</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Action Type</label>
              <select className="form-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="form-input" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input className="form-input" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiActivity /></div>
          <div className="empty-state-text">No activity found</div>
          <div className="empty-state-sub">Activity will appear here as actions are performed</div>
        </div>
      ) : (
        <div>
          {items.map((item, idx) => {
            const type = getActionType(item.action);
            const color = actionColors[type] || '#a0a0b8';
            const icon = actionIcons[type] || <FiActivity />;
            return (
              <div
                key={`${item.id}-${idx}`}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `${color}20`,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginTop: '0.15rem'
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#e0e0ff', marginBottom: '0.25rem' }}>
                    <span style={{ color }}>{item.action}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a0a0b8', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FiUser /> User #{item.user_id}
                    </span>
                    {item.resource_type && (
                      <span>
                        {item.resource_type} #{item.resource_id}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FiClock /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
