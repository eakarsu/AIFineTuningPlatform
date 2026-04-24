import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDelete, setShowDelete] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/notifications'); setItems(res.data.data || res.data.notifications || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const markAsRead = async (item) => {
    try { await api.put(`/notifications/${item.id}/read`); toast.success('Marked as read'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const markAllAsRead = async () => {
    try { await api.put('/notifications/mark-all-read'); toast.success('All marked as read'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/notifications/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'error': case 'alert': return <FiAlertCircle style={{ color: '#ff4757' }} />;
      case 'success': return <FiCheckCircle style={{ color: '#00d4aa' }} />;
      case 'warning': return <FiAlertCircle style={{ color: '#ffa502' }} />;
      default: return <FiInfo style={{ color: '#1e90ff' }} />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'error': case 'alert': return '#ff4757';
      case 'success': return '#00d4aa';
      case 'warning': return '#ffa502';
      default: return '#1e90ff';
    }
  };

  const unreadCount = items.filter(i => !i.is_read).length;

  const filtered = items
    .filter(i => {
      if (filter === 'unread') return !i.is_read;
      if (filter === 'read') return i.is_read;
      return true;
    })
    .filter(i => (i.title || '').toLowerCase().includes(search.toLowerCase()) || (i.message || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search notifications..." />
          {unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllAsRead}><FiCheckCircle /> Mark All Read</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'unread', 'read'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiBell /></div><div className="empty-state-text">{filter === 'unread' ? 'No unread notifications' : 'No notifications'}</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(item => (
            <div className="card" key={item.id} style={{ borderLeft: !item.is_read ? '3px solid #1e90ff' : '3px solid transparent', opacity: item.is_read ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                  <div style={{ marginTop: '2px', fontSize: '18px' }}>{getTypeIcon(item.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#e0e0ff' }}>{item.title || 'Notification'}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: getTypeBadgeColor(item.type) + '20', color: getTypeBadgeColor(item.type), fontWeight: 500 }}>{item.type || 'info'}</span>
                      {!item.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e90ff', display: 'inline-block' }} />}
                    </div>
                    <div style={{ fontSize: '13px', color: '#a0a0b8', marginBottom: '4px' }}>{item.message || ''}</div>
                    <div style={{ fontSize: '12px', color: '#6b6b80' }}>{timeAgo(item.created_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                  {!item.is_read && <button className="btn btn-secondary btn-sm" onClick={() => markAsRead(item)} title="Mark as read"><FiCheck /></button>}
                  <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(item)} title="Delete"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Notification" message={`Delete "${showDelete?.title}"?`} />
    </div>
  );
}
