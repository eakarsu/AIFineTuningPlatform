import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const TAG_COLORS = ['#ff4757', '#ffa502', '#6c63ff', '#00d4aa', '#1e90ff', '#ff9f43', '#ee5a24', '#0abde3', '#10ac84', '#5f27cd', '#a0a0b8'];

export default function TagsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#6c63ff' });

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => { if (selected) fetchResources(selected); }, [selected]);

  const fetchItems = async () => {
    try { const res = await api.get('/tags'); setItems(res.data.data || res.data.tags || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const fetchResources = async (tag) => {
    setLoadingResources(true);
    try { const res = await api.get(`/tags/${tag.id}/resources`); setResources(res.data.data || res.data.resources || res.data || []); }
    catch { setResources([]); } finally { setLoadingResources(false); }
  };

  const resetForm = () => setForm({ name: '', color: '#6c63ff' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/tags', form); toast.success('Tag created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tags/${selected.id}`, form);
      toast.success('Updated');
      setShowEdit(false);
      const updated = { ...selected, name: form.name, color: form.color };
      setSelected(updated);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/tags/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) { setSelected(null); setResources([]); } fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (tag) => {
    setForm({ name: tag.name || '', color: tag.color || '#6c63ff' });
    setShowEdit(true);
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  const groupedResources = resources.reduce((acc, r) => {
    const type = r.resource_type || r.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Tags</h1><p className="page-subtitle">Organize resources with tags</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search tags..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Tag</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', minHeight: '400px' }}>
        {/* Left: Tag List */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><FiTag /></div><div className="empty-state-text">No tags</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(tag => (
                <div
                  className="card card-hover"
                  key={tag.id}
                  onClick={() => setSelected(tag)}
                  style={{ borderLeft: `3px solid ${tag.color || '#6c63ff'}`, background: selected?.id === tag.id ? '#1a1a2e' : undefined, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: tag.color || '#6c63ff', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#e0e0ff' }}>{tag.name}</span>
                      <span style={{ fontSize: '12px', color: '#a0a0b8' }}>{tag.resource_count != null ? tag.resource_count : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(tag); openEdit(tag); }} style={{ padding: '4px 6px' }}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(tag)} style={{ padding: '4px 6px' }}><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Resources for Selected Tag */}
        <div style={{ flex: 1 }}>
          {selected ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: selected.color || '#6c63ff', display: 'inline-block' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e0e0ff', margin: 0 }}>{selected.name}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setResources([]); }} style={{ marginLeft: 'auto' }}><FiX /> Close</button>
              </div>
              {loadingResources ? (
                <div className="loading-spinner"><div className="spinner" /></div>
              ) : resources.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon"><FiTag /></div><div className="empty-state-text">No resources tagged with "{selected.name}"</div></div>
              ) : (
                Object.entries(groupedResources).map(([type, items]) => (
                  <div key={type} style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0b8', textTransform: 'capitalize', marginBottom: '8px' }}>{type} ({items.length})</h3>
                    <div className="card-grid">
                      {items.map((r, i) => (
                        <div className="card" key={r.id || i}>
                          <div style={{ padding: '12px 16px' }}>
                            <div className="card-title">{r.name || r.resource_name || `${type} #${r.resource_id || i}`}</div>
                            <div className="card-description">{r.description || ''}</div>
                            <div className="card-meta">
                              <span className="card-meta-item" style={{ textTransform: 'capitalize' }}>{type}</span>
                              {r.created_at && <span className="card-meta-item">{new Date(r.created_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon"><FiTag /></div><div className="empty-state-text">Select a tag to view its resources</div></div>
          )}
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Tag">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., production" required /></div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TAG_COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: form.color === c ? '3px solid #e0e0ff' : '3px solid transparent', cursor: 'pointer', transition: 'border-color 0.2s' }} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: form.color, display: 'inline-block' }} />
            <span style={{ color: '#a0a0b8', fontSize: '13px' }}>Preview: </span>
            <span style={{ padding: '4px 12px', borderRadius: '6px', background: form.color + '20', color: form.color, fontWeight: 500, fontSize: '13px' }}>{form.name || 'tag-name'}</span>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Tag">
        <form onSubmit={handleEdit}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TAG_COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: form.color === c ? '3px solid #e0e0ff' : '3px solid transparent', cursor: 'pointer', transition: 'border-color 0.2s' }} />
              ))}
            </div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Tag" message={`Delete tag "${showDelete?.name}"? Resources will be untagged.`} />
    </div>
  );
}
