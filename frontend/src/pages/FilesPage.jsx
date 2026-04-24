import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiFile, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiDownload, FiImage, FiFileText, FiFolder } from 'react-icons/fi';

export default function FilesPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', original_name: '', mime_type: '', size_bytes: '', path: '', category: 'general', description: '' });

  useEffect(() => { fetchItems(); fetchStats(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/files'); setItems(res.data.data || res.data.files || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const res = await api.get('/files/stats'); setStats(res.data.data || res.data.stats || res.data); }
    catch { setStats(null); }
  };

  const resetForm = () => setForm({ name: '', original_name: '', mime_type: '', size_bytes: '', path: '', category: 'general', description: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form, size_bytes: Number(form.size_bytes) || 0 };
    try { await api.post('/files', payload); toast.success('File created'); setShowCreate(false); resetForm(); fetchItems(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = { ...form, size_bytes: Number(form.size_bytes) || 0 };
    try { await api.put(`/files/${selected.id}`, payload); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/files/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', original_name: item.original_name || '', mime_type: item.mime_type || '', size_bytes: String(item.size_bytes || 0), path: item.path || '', category: item.category || 'general', description: item.description || '' });
    setShowEdit(true);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  };

  const getFileIcon = (mime) => {
    if (!mime) return <FiFile />;
    if (mime.startsWith('image/')) return <FiImage />;
    if (mime.includes('text') || mime.includes('pdf') || mime.includes('document')) return <FiFileText />;
    return <FiFile />;
  };

  const categories = ['dataset', 'report', 'config', 'template', 'image', 'document', 'benchmark', 'log', 'general'];

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
              {selected.category && <StatusBadge status={selected.category} />}
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Original Name</div><div className="detail-field-value">{selected.original_name || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">MIME Type</div><div className="detail-field-value">{selected.mime_type || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Size</div><div className="detail-field-value">{formatSize(selected.size_bytes)}</div></div>
              <div className="detail-field"><div className="detail-field-label">Path</div><div className="detail-field-value">{selected.path || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Category</div><div className="detail-field-value">{selected.category || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Updated</div><div className="detail-field-value">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : 'N/A'}</div></div>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit File">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Original Name</label><input className="form-input" value={form.original_name} onChange={e => setForm({...form, original_name: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">MIME Type</label><input className="form-input" value={form.mime_type} onChange={e => setForm({...form, mime_type: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Size (bytes)</label><input className="form-input" type="number" value={form.size_bytes} onChange={e => setForm({...form, size_bytes: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Path</label><input className="form-input" value={form.path} onChange={e => setForm({...form, path: e.target.value})} /></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete File" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Files</h1><p className="page-subtitle">Manage uploaded files and assets</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search files..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New File</button>
        </div>
      </div>
      {stats && (
        <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card"><div className="stat-value">{stats.total_files ?? stats.total ?? items.length}</div><div className="stat-label">Total Files</div></div>
          <div className="stat-card"><div className="stat-value">{formatSize(stats.total_size ?? stats.total_size_bytes ?? 0)}</div><div className="stat-label">Total Size</div></div>
          <div className="stat-card"><div className="stat-value">{stats.categories_count ?? Object.keys(stats.by_category || {}).length ?? '-'}</div><div className="stat-label">Categories</div></div>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiFolder /></div><div className="empty-state-text">No files</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{getFileIcon(item.mime_type)} {item.name}</div>
                  <div className="card-description">{item.description?.substring(0, 80) || item.original_name || 'No description'}</div>
                </div>
                {item.category && <StatusBadge status={item.category} />}
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiDownload /> {formatSize(item.size_bytes)}</span>
                <span className="card-meta-item"><FiFolder /> {item.category || 'general'}</span>
                <span className="card-meta-item"><FiFile /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create File Record">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Original Name</label><input className="form-input" value={form.original_name} onChange={e => setForm({...form, original_name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">MIME Type</label><input className="form-input" value={form.mime_type} onChange={e => setForm({...form, mime_type: e.target.value})} placeholder="e.g., text/csv" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Size (bytes)</label><input className="form-input" type="number" value={form.size_bytes} onChange={e => setForm({...form, size_bytes: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Path</label><input className="form-input" value={form.path} onChange={e => setForm({...form, path: e.target.value})} /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
