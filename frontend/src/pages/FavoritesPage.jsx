import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiStar, FiTrash2, FiExternalLink, FiFilter } from 'react-icons/fi';

const RESOURCE_TYPES = ['All', 'Jobs', 'Models', 'Datasets', 'Deployments', 'Evaluations', 'Configs', 'Pipelines'];

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showDelete, setShowDelete] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/favorites'); setItems(res.data.data || res.data.favorites || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const handleUnfavorite = async () => {
    try { await api.delete(`/favorites/${showDelete.id}`); toast.success('Removed from favorites'); setShowDelete(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const quickUnfavorite = async (item) => {
    try { await api.delete(`/favorites/${item.id}`); toast.success('Removed from favorites'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const navigateToResource = (item) => {
    const typeRoutes = {
      job: '/jobs', jobs: '/jobs',
      model: '/models', models: '/models',
      dataset: '/datasets', datasets: '/datasets',
      deployment: '/deployments', deployments: '/deployments',
      evaluation: '/evaluations', evaluations: '/evaluations',
      config: '/training-configs', configs: '/training-configs',
      pipeline: '/data-pipelines', pipelines: '/data-pipelines'
    };
    const type = (item.resource_type || '').toLowerCase();
    const route = typeRoutes[type] || `/${type}s`;
    window.location.href = `${route}/${item.resource_id || ''}`;
  };

  const getTypeBadgeColor = (type) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'job': case 'jobs': return '#6c63ff';
      case 'model': case 'models': return '#00d4aa';
      case 'dataset': case 'datasets': return '#1e90ff';
      case 'deployment': case 'deployments': return '#ff9f43';
      case 'evaluation': case 'evaluations': return '#ff4757';
      case 'config': case 'configs': return '#0abde3';
      case 'pipeline': case 'pipelines': return '#5f27cd';
      default: return '#a0a0b8';
    }
  };

  const filtered = items
    .filter(i => {
      if (filter === 'All') return true;
      const type = (i.resource_type || '').toLowerCase();
      const filterLower = filter.toLowerCase();
      return type === filterLower || type === filterLower.slice(0, -1);
    })
    .filter(i => (i.resource_name || i.name || '').toLowerCase().includes(search.toLowerCase()));

  const groupedByType = filtered.reduce((acc, item) => {
    const type = item.resource_type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Favorites</h1><p className="page-subtitle">{items.length} favorited item{items.length !== 1 ? 's' : ''}</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search favorites..." />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FiFilter style={{ color: '#a0a0b8' }} />
        {RESOURCE_TYPES.map(t => (
          <button key={t} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiStar /></div><div className="empty-state-text">{filter !== 'All' ? `No favorited ${filter.toLowerCase()}` : 'No favorites yet'}</div></div>
      ) : (
        Object.entries(groupedByType).map(([type, typeItems]) => (
          <div key={type} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b8', textTransform: 'capitalize', marginBottom: '12px' }}>{type} ({typeItems.length})</h3>
            <div className="card-grid">
              {typeItems.map(item => (
                <div className="card card-hover" key={item.id}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{item.resource_name || item.name || `${type} #${item.resource_id || ''}`}</div>
                      <div className="card-description">{item.description || ''}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', background: getTypeBadgeColor(item.resource_type) + '20', color: getTypeBadgeColor(item.resource_type), fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{item.resource_type || 'Resource'}</span>
                  </div>
                  <div className="card-meta">
                    <span className="card-meta-item"><FiStar style={{ color: '#ffa502' }} /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', padding: '0 16px 12px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigateToResource(item)}><FiExternalLink /> Open</button>
                    <button className="btn btn-danger btn-sm" onClick={() => quickUnfavorite(item)}><FiTrash2 /> Unfavorite</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleUnfavorite} title="Remove Favorite" message={`Remove "${showDelete?.resource_name || showDelete?.name}" from favorites?`} />
    </div>
  );
}
