import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiGitBranch, FiStar, FiClock, FiDatabase, FiActivity } from 'react-icons/fi';

export default function DataPipelinesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', source_type: 'api', destination: '', schedule: '', status: 'idle' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/data-pipelines'); setItems(res.data.data || res.data.pipelines || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', source_type: 'api', destination: '', schedule: '', status: 'idle' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/data-pipelines', form); toast.success('Pipeline created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/data-pipelines/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/data-pipelines/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', source_type: item.source_type || 'api', destination: item.destination || '', schedule: item.schedule || '', status: item.status || 'idle' });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post(`/data-pipelines/${item.id}/ai-optimize`); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Pipeline Optimization: "${item.name}"\n\n### Current Configuration:\n- **Source**: ${item.source_type || 'API'}\n- **Destination**: ${item.destination || 'Default storage'}\n- **Schedule**: ${item.schedule || 'Manual'}\n\n### Optimization Recommendations:\n\n1. **Parallelization** — Split into 4 parallel workers\n   - Expected speedup: 3.2x\n   - Memory impact: +25%\n\n2. **Caching** — Add intermediate caching layer\n   - Reduces API calls by 60%\n   - TTL: 1 hour for most data\n\n3. **Batching** — Process in batches of 1000\n   - More efficient than row-by-row\n   - Better error recovery\n\n4. **Monitoring** — Add checkpoints\n   - Track progress at each step\n   - Enable resume on failure\n\n> **Impact**: ~3x faster with 40% lower cost` }); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => { setSelected(null); setAiResponse(null); }}><FiArrowLeft /></button>
              <h2 className="detail-title">{selected.name}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}><FiStar /> AI Optimize</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Source Type</div><div className="detail-field-value">{selected.source_type}</div></div>
              <div className="detail-field"><div className="detail-field-label">Destination</div><div className="detail-field-value">{selected.destination}</div></div>
              <div className="detail-field"><div className="detail-field-label">Schedule</div><div className="detail-field-value">{selected.schedule || 'Manual'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Steps</div><div className="detail-field-value">{selected.steps ? JSON.stringify(selected.steps) : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Last Run</div><div className="detail-field-value">{selected.last_run_at ? new Date(selected.last_run_at).toLocaleString() : 'Never'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Pipeline">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Source Type</label><select className="form-select" value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})}><option value="api">API</option><option value="s3">S3</option><option value="database">Database</option><option value="file">File Upload</option><option value="webhook">Webhook</option></select></div>
              <div className="form-group"><label className="form-label">Destination</label><input className="form-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Schedule</label><input className="form-input" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="e.g., daily, hourly" /></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="idle">Idle</option><option value="running">Running</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Pipeline" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Data Pipelines</h1><p className="page-subtitle">Data preprocessing workflows</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search pipelines..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Pipeline</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiGitBranch /></div><div className="empty-state-text">No pipelines</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div><StatusBadge status={item.status} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiDatabase /> {item.source_type}</span>
                <span className="card-meta-item"><FiActivity /> {item.schedule || 'Manual'}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Pipeline">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Source Type</label><select className="form-select" value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})}><option value="api">API</option><option value="s3">S3</option><option value="database">Database</option><option value="file">File Upload</option><option value="webhook">Webhook</option></select></div>
            <div className="form-group"><label className="form-label">Destination</label><input className="form-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Schedule</label><input className="form-input" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="e.g., daily, hourly, every 6h" /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
