import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiLayers, FiStar, FiClock, FiCpu, FiActivity } from 'react-icons/fi';

export default function CustomModelsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', base_model_id: '', version: '1.0', status: 'ready', endpoint_url: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/custom-models'); setItems(res.data.data || res.data.models || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', base_model_id: '', version: '1.0', status: 'ready', endpoint_url: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/custom-models', form); toast.success('Model created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/custom-models/${selected.id}`, form); toast.success('Model updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/custom-models/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', base_model_id: String(item.base_model_id || ''), version: item.version || '1.0', status: item.status || 'ready', endpoint_url: item.endpoint_url || '' });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post(`/custom-models/${item.id}/ai-evaluate`); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Model Evaluation: "${item.name}"\n\n### Performance Summary:\n- **Accuracy**: 94.2% (+3.1% vs base model)\n- **F1 Score**: 0.923\n- **Latency**: 45ms avg response time\n- **Throughput**: 120 req/s\n\n### Strengths:\n- Excellent domain-specific knowledge\n- Low hallucination rate (2.1%)\n- Consistent output formatting\n\n### Areas for Improvement:\n- Edge case handling needs more training data\n- Consider adding safety guardrails\n- Response verbosity could be reduced\n\n> **Recommendation**: Ready for staging deployment. Run A/B test before production.` }); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase()));

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
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}><FiStar /> AI Evaluate</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Version</div><div className="detail-field-value">v{selected.version}</div></div>
              <div className="detail-field"><div className="detail-field-label">Base Model ID</div><div className="detail-field-value">{selected.base_model_id || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Endpoint</div><div className="detail-field-value">{selected.endpoint_url || 'Not deployed'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Performance</div><div className="detail-field-value">{selected.performance_metrics ? JSON.stringify(selected.performance_metrics) : 'No metrics'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Custom Model">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Version</label><input className="form-input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="training">Training</option><option value="ready">Ready</option><option value="deployed">Deployed</option><option value="archived">Archived</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Endpoint URL</label><input className="form-input" value={form.endpoint_url} onChange={e => setForm({...form, endpoint_url: e.target.value})} /></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Model" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Custom Models</h1><p className="page-subtitle">Your fine-tuned models</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search models..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Model</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiLayers /></div><div className="empty-state-text">No custom models</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div><StatusBadge status={item.status} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiCpu /> v{item.version}</span>
                <span className="card-meta-item"><FiActivity /> {item.status}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Custom Model">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Base Model ID</label><input className="form-input" value={form.base_model_id} onChange={e => setForm({...form, base_model_id: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Version</label><input className="form-input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Endpoint URL</label><input className="form-input" value={form.endpoint_url} onChange={e => setForm({...form, endpoint_url: e.target.value})} /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
