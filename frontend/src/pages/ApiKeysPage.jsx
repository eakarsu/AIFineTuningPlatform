import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiKey, FiClock, FiShield, FiCopy } from 'react-icons/fi';

export default function ApiKeysPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: 'read', rate_limit: '1000', is_active: true });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/api-keys'); setItems(res.data.data || res.data.apiKeys || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', permissions: 'read', rate_limit: '1000', is_active: true });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api-keys', form);
      const key = res.data.key || res.data.apiKey?.key;
      if (key) setNewKey(key);
      toast.success('API Key created');
      setShowCreate(false); resetForm(); fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/api-keys/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/api-keys/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', permissions: item.permissions || 'read', rate_limit: String(item.rate_limit || '1000'), is_active: item.is_active !== false });
    setShowEdit(true);
  };

  const copyKey = (text) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
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
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Key Prefix</div><div className="detail-field-value" style={{fontFamily: 'monospace'}}>{selected.key_prefix}...</div></div>
              <div className="detail-field"><div className="detail-field-label">Permissions</div><div className="detail-field-value">{selected.permissions}</div></div>
              <div className="detail-field"><div className="detail-field-label">Rate Limit</div><div className="detail-field-value">{selected.rate_limit} req/min</div></div>
              <div className="detail-field"><div className="detail-field-label">Last Used</div><div className="detail-field-value">{selected.last_used_at ? new Date(selected.last_used_at).toLocaleString() : 'Never'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Expires</div><div className="detail-field-value">{selected.expires_at ? new Date(selected.expires_at).toLocaleString() : 'Never'}</div></div>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit API Key">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Permissions</label><select className="form-select" value={form.permissions} onChange={e => setForm({...form, permissions: e.target.value})}><option value="read">Read</option><option value="write">Write</option><option value="admin">Admin</option><option value="read,write">Read + Write</option></select></div>
              <div className="form-group"><label className="form-label">Rate Limit</label><input className="form-input" type="number" value={form.rate_limit} onChange={e => setForm({...form, rate_limit: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} style={{marginRight: '8px'}} />Active</label></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Revoke API Key" message={`Revoke "${showDelete?.name}"? Applications using this key will stop working.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">API Keys</h1><p className="page-subtitle">Manage API access keys</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search keys..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New API Key</button>
        </div>
      </div>

      {newKey && (
        <div className="ai-output-container" style={{marginBottom: '20px'}}>
          <div className="ai-output-header"><FiKey /> New API Key Created</div>
          <div className="ai-output-body">
            <p style={{marginBottom: '8px', color: '#ffa502'}}>Copy this key now. You won't be able to see it again!</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#0a0a0f', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px'}}>
              <span style={{flex: 1, wordBreak: 'break-all'}}>{newKey}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => copyKey(newKey)}><FiCopy /> Copy</button>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setNewKey(null)} style={{marginTop: '8px'}}>Dismiss</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiKey /></div><div className="empty-state-text">No API keys</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description" style={{fontFamily: 'monospace'}}>{item.key_prefix}...</div></div><StatusBadge status={item.is_active ? 'active' : 'inactive'} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiShield /> {item.permissions}</span>
                <span className="card-meta-item"><FiKey /> {item.rate_limit} req/min</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create API Key">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Production API" required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Permissions</label><select className="form-select" value={form.permissions} onChange={e => setForm({...form, permissions: e.target.value})}><option value="read">Read</option><option value="write">Write</option><option value="admin">Admin</option><option value="read,write">Read + Write</option></select></div>
            <div className="form-group"><label className="form-label">Rate Limit (req/min)</label><input className="form-input" type="number" value={form.rate_limit} onChange={e => setForm({...form, rate_limit: e.target.value})} /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Generate Key</button></div>
        </form>
      </Modal>
    </div>
  );
}
