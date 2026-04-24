import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiLink, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiZap, FiToggleLeft, FiToggleRight, FiPlay } from 'react-icons/fi';

export default function WebhooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', url: '', events: '', secret: '', is_active: true });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/webhooks'); setItems(res.data.data || res.data.webhooks || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', url: '', events: '', secret: '', is_active: true });

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form, events: form.events.split(',').map(s => s.trim()).filter(Boolean) };
    try { await api.post('/webhooks', payload); toast.success('Webhook created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = { ...form, events: form.events.split(',').map(s => s.trim()).filter(Boolean) };
    try { await api.put(`/webhooks/${selected.id}`, payload); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/webhooks/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    const events = Array.isArray(item.events) ? item.events.join(', ') : (item.events || '');
    setForm({ name: item.name || '', url: item.url || '', events, secret: item.secret || '', is_active: item.is_active !== false });
    setShowEdit(true);
  };

  const toggleActive = async (item) => {
    try { await api.put(`/webhooks/${item.id}/toggle`); toast.success(item.is_active ? 'Deactivated' : 'Activated'); if (selected?.id === item.id) setSelected({ ...selected, is_active: !item.is_active }); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const testWebhook = async (item) => {
    try { await api.post(`/webhooks/${item.id}/test`); toast.success('Test event sent'); }
    catch (err) { toast.error(err.response?.data?.error || 'Test failed'); }
  };

  const truncateUrl = (url, maxLen = 40) => {
    if (!url) return 'N/A';
    return url.length > maxLen ? url.substring(0, maxLen) + '...' : url;
  };

  const getEventsCount = (events) => {
    if (Array.isArray(events)) return events.length;
    if (typeof events === 'string') return events.split(',').filter(Boolean).length;
    return 0;
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.url || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    const eventsList = Array.isArray(selected.events) ? selected.events : (selected.events || '').split(',').filter(Boolean);
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => setSelected(null)}><FiArrowLeft /></button>
              <h2 className="detail-title">{selected.name}</h2>
              <StatusBadge status={selected.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => testWebhook(selected)}><FiPlay /> Test</button>
              <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(selected)}>{selected.is_active ? <><FiToggleRight /> Deactivate</> : <><FiToggleLeft /> Activate</>}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Name</div><div className="detail-field-value">{selected.name}</div></div>
              <div className="detail-field"><div className="detail-field-label">URL</div><div className="detail-field-value" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{selected.url || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Secret</div><div className="detail-field-value" style={{ fontFamily: 'monospace' }}>{selected.secret ? '********' : 'None'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Status</div><div className="detail-field-value">{selected.is_active ? 'Active' : 'Inactive'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Last Triggered</div><div className="detail-field-value">{selected.last_triggered_at ? new Date(selected.last_triggered_at).toLocaleString() : 'Never'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Failure Count</div><div className="detail-field-value" style={{ color: (selected.failure_count || 0) > 0 ? '#ff4757' : '#00d4aa' }}>{selected.failure_count || 0}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div className="detail-field-label" style={{ marginBottom: '8px' }}>Events ({eventsList.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {eventsList.length > 0 ? eventsList.map((ev, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', background: '#6c63ff20', color: '#6c63ff', fontSize: '12px', fontWeight: 500 }}>{ev.trim()}</span>
                )) : <span style={{ color: '#a0a0b8', fontSize: '13px' }}>No events configured</span>}
              </div>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Webhook">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">URL</label><input className="form-input" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" required /></div>
            <div className="form-group"><label className="form-label">Events (comma-separated)</label><input className="form-input" value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="job.completed, model.deployed, training.failed" /></div>
            <div className="form-group"><label className="form-label">Secret</label><input className="form-input" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} placeholder="Optional signing secret" /></div>
            <div className="form-group"><label className="form-label"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: '8px' }} />Active</label></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Webhook" message={`Delete webhook "${showDelete?.name}"? This cannot be undone.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Webhooks</h1><p className="page-subtitle">Manage webhook endpoints and event subscriptions</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search webhooks..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Webhook</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiLink /></div><div className="empty-state-text">No webhooks configured</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name}</div>
                  <div className="card-description" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{truncateUrl(item.url)}</div>
                </div>
                <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiZap /> {getEventsCount(item.events)} event{getEventsCount(item.events) !== 1 ? 's' : ''}</span>
                <span className="card-meta-item"><FiLink /> {item.last_triggered_at ? new Date(item.last_triggered_at).toLocaleDateString() : 'Never'}</span>
                {(item.failure_count || 0) > 0 && <span className="card-meta-item" style={{ color: '#ff4757' }}>{item.failure_count} failures</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Webhook">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Slack Notification" required /></div>
          <div className="form-group"><label className="form-label">URL</label><input className="form-input" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" required /></div>
          <div className="form-group"><label className="form-label">Events (comma-separated)</label><input className="form-input" value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="job.completed, model.deployed, training.failed" /></div>
          <div className="form-group"><label className="form-label">Secret</label><input className="form-input" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} placeholder="Optional signing secret" /></div>
          <div className="form-group"><label className="form-label"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: '8px' }} />Active</label></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
