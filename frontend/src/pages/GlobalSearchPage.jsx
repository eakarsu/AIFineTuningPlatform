import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCpu, FiLayers, FiDatabase, FiCloud, FiFileText } from 'react-icons/fi';

const categoryConfig = {
  jobs: { label: 'Fine-Tuning Jobs', icon: <FiCpu />, path: '/jobs' },
  models: { label: 'Custom Models', icon: <FiLayers />, path: '/models' },
  datasets: { label: 'Datasets', icon: <FiDatabase />, path: '/datasets' },
  deployments: { label: 'Deployments', icon: <FiCloud />, path: '/deployments' },
  templates: { label: 'Prompt Templates', icon: <FiFileText />, path: '/templates' },
};

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timeout = setTimeout(() => { fetchResults(); }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data.data || res.data.results || res.data || {});
    } catch {
      toast.error('Search failed');
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results && Object.values(results).some(arr => Array.isArray(arr) && arr.length > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Search</h1>
          <p className="page-subtitle">Search across all resources</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', color: '#a0a0b8' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '3rem', fontSize: '1.1rem', padding: '0.9rem 1rem 0.9rem 3rem' }}
            placeholder="Search for anything..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      {!loading && !query.trim() && (
        <div className="empty-state">
          <div className="empty-state-icon"><FiSearch /></div>
          <div className="empty-state-text">Search for anything...</div>
          <div className="empty-state-sub">Find jobs, models, datasets, deployments, and templates</div>
        </div>
      )}

      {!loading && query.trim() && results && !hasResults && (
        <div className="empty-state">
          <div className="empty-state-icon"><FiSearch /></div>
          <div className="empty-state-text">No results found</div>
          <div className="empty-state-sub">Try a different search term</div>
        </div>
      )}

      {!loading && hasResults && Object.entries(results).map(([category, items]) => {
        if (!Array.isArray(items) || items.length === 0) return null;
        const config = categoryConfig[category] || { label: category, icon: <FiSearch />, path: '/' };
        return (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#e0e0ff' }}>
              {config.icon} {config.label}
              <span style={{ fontSize: '0.85rem', color: '#a0a0b8', fontWeight: 400 }}>({items.length})</span>
            </h3>
            <div className="card-grid">
              {items.map(item => (
                <div className="card card-hover" key={`${category}-${item.id}`} onClick={() => navigate(config.path)}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{item.name || item.action || `#${item.id}`}</div>
                      <div className="card-description">{item.description || item.status || 'No description'}</div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(108, 99, 255, 0.15)',
                      color: '#6c63ff',
                      textTransform: 'capitalize'
                    }}>
                      {category}
                    </span>
                  </div>
                  <div className="card-meta">
                    <span className="card-meta-item">{config.icon} {config.label}</span>
                    {item.created_at && <span className="card-meta-item">{new Date(item.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
