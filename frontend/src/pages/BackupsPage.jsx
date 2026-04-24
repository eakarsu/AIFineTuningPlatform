import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiDatabase, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiDownloadCloud, FiUploadCloud, FiRefreshCw } from 'react-icons/fi';

export default function BackupsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [showRestore, setShowRestore] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', backup_type: 'full', tables_included: [] });

  const allTables = ['users', 'training_datasets', 'fine_tuning_jobs', 'custom_models', 'evaluations', 'deployments', 'api_keys', 'audit_logs'];

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/backups'); setItems(res.data.data || res.data.backups || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', backup_type: 'full', tables_included: [] });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/backups', form); toast.success('Backup created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/backups/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/backups/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    const tables = item.tables_included || [];
    const parsedTables = typeof tables === 'string' ? (function() { try { return JSON.parse(tables); } catch { return []; } })() : tables;
    setForm({ name: item.name || '', description: item.description || '', backup_type: item.backup_type || 'full', tables_included: parsedTables });
    setShowEdit(true);
  };

  const handleRestore = async () => {
    try { await api.post(`/backups/${showRestore.id}/restore`); toast.success('Restore initiated'); setShowRestore(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to restore'); }
  };

  const toggleTable = (table) => {
    setForm(prev => ({
      ...prev,
      tables_included: prev.tables_included.includes(table)
        ? prev.tables_included.filter(t => t !== table)
        : [...prev.tables_included, table]
    }));
  };

  const formatSize = (mb) => {
    if (!mb || mb === 0) return '0 MB';
    if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
    return Number(mb).toFixed(1) + ' MB';
  };

  const getTablesArray = (tables) => {
    if (!tables) return [];
    if (Array.isArray(tables)) return tables;
    if (typeof tables === 'string') { try { return JSON.parse(tables); } catch { return []; } }
    return [];
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    const tablesArr = getTablesArray(selected.tables_included);
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => setSelected(null)}><FiArrowLeft /></button>
              <h2 className="detail-title">{selected.name}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="detail-actions">
              {selected.status === 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowRestore(selected)}><FiUploadCloud /> Restore</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Backup Type</div><div className="detail-field-value">{selected.backup_type}</div></div>
              <div className="detail-field"><div className="detail-field-label">Size</div><div className="detail-field-value">{formatSize(selected.size_mb)}</div></div>
              <div className="detail-field"><div className="detail-field-label">Status</div><div className="detail-field-value"><StatusBadge status={selected.status} /></div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Completed</div><div className="detail-field-value">{selected.completed_at ? new Date(selected.completed_at).toLocaleString() : 'Not yet'}</div></div>
            </div>
            <div className="detail-field" style={{ marginTop: '1rem' }}>
              <div className="detail-field-label">Tables Included</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {tablesArr.length > 0 ? tablesArr.map(t => (
                  <span key={t} style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'var(--bg-tertiary, #2a2a3e)', fontSize: '0.85rem' }}>{t}</span>
                )) : <span>N/A</span>}
              </div>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Backup">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Backup Type</label>
              <select className="form-select" value={form.backup_type} onChange={e => setForm({...form, backup_type: e.target.value})}>
                <option value="full">Full</option><option value="incremental">Incremental</option><option value="partial">Partial</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Tables to Include</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {allTables.map(table => (
                  <label key={table} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.tables_included.includes(table)} onChange={() => toggleTable(table)} />
                    {table.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Backup" message={`Delete "${showDelete?.name}"?`} />
        <ConfirmDialog isOpen={!!showRestore} onClose={() => setShowRestore(null)} onConfirm={handleRestore} title="Restore Backup" message={`Restore from "${showRestore?.name}"? This may overwrite current data.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Backups</h1><p className="page-subtitle">Database backups and restoration</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search backups..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Backup</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiDatabase /></div><div className="empty-state-text">No backups</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name}</div>
                  <div className="card-description">{item.backup_type} backup</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiDownloadCloud /> {formatSize(item.size_mb)}</span>
                <span className="card-meta-item"><FiDatabase /> {item.backup_type}</span>
                <span className="card-meta-item"><FiRefreshCw /> {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Backup">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Backup Type</label>
            <select className="form-select" value={form.backup_type} onChange={e => setForm({...form, backup_type: e.target.value})}>
              <option value="full">Full</option><option value="incremental">Incremental</option><option value="partial">Partial</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Tables to Include</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              {allTables.map(table => (
                <label key={table} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.tables_included.includes(table)} onChange={() => toggleTable(table)} />
                  {table.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
