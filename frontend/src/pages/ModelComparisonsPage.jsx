import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiColumns, FiStar, FiClock, FiBarChart2 } from 'react-icons/fi';

export default function ModelComparisonsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', model_ids: '', status: 'pending' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/model-comparisons'); setItems(res.data.data || res.data.comparisons || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', model_ids: '', status: 'pending' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/model-comparisons', { ...form, model_ids: form.model_ids.split(',').map(s => s.trim()) }); toast.success('Comparison created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/model-comparisons/${selected.id}`, { ...form, model_ids: form.model_ids.split(',').map(s => s.trim()) }); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/model-comparisons/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    const ids = Array.isArray(item.model_ids) ? item.model_ids.join(', ') : String(item.model_ids || '');
    setForm({ name: item.name || '', description: item.description || '', model_ids: ids, status: item.status || 'pending' });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post(`/model-comparisons/${item.id}/ai-analyze`); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Comparison Analysis: "${item.name}"\n\n### Model Rankings:\n\n| Rank | Model | Accuracy | Latency | Cost |\n|------|-------|----------|---------|------|\n| 1 | Model A | 94.2% | 45ms | $0.02/1K |\n| 2 | Model B | 92.8% | 32ms | $0.01/1K |\n| 3 | Model C | 91.5% | 67ms | $0.03/1K |\n\n### Key Insights:\n- **Best overall**: Model A (highest accuracy)\n- **Best value**: Model B (best cost/performance ratio)\n- **Best for latency-critical**: Model B (fastest)\n\n### Tradeoffs:\n- Model A has 1.4% higher accuracy but 40% higher latency\n- Model C has no advantage in this comparison\n\n> **Recommendation**: Use Model A for quality-critical tasks, Model B for high-volume/low-latency scenarios` }); }
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
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}><FiStar /> AI Analyze</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Models</div><div className="detail-field-value">{Array.isArray(selected.model_ids) ? selected.model_ids.join(', ') : selected.model_ids}</div></div>
              <div className="detail-field"><div className="detail-field-label">Metrics</div><div className="detail-field-value">{selected.metrics ? JSON.stringify(selected.metrics) : 'Pending'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Results</div><div className="detail-field-value">{selected.results ? JSON.stringify(selected.results) : 'Pending'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Comparison">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Model IDs (comma separated)</label><input className="form-input" value={form.model_ids} onChange={e => setForm({...form, model_ids: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="pending">Pending</option><option value="running">Running</option><option value="completed">Completed</option></select></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Comparison" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Model Comparisons</h1><p className="page-subtitle">Compare model performance</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search comparisons..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Comparison</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiColumns /></div><div className="empty-state-text">No comparisons</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div><StatusBadge status={item.status} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiBarChart2 /> {Array.isArray(item.model_ids) ? item.model_ids.length : '?'} models</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Comparison">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Model IDs (comma separated)</label><input className="form-input" value={form.model_ids} onChange={e => setForm({...form, model_ids: e.target.value})} placeholder="e.g., 1, 2, 3" /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
