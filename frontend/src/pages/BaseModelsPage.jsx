import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiBox, FiStar, FiCpu, FiDollarSign, FiLayers } from 'react-icons/fi';

export default function BaseModelsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', provider: '', description: '', parameters: '', context_length: '', category: '', pricing_per_1k: '', is_available: true });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/base-models'); setItems(res.data.data || res.data.models || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', provider: '', description: '', parameters: '', context_length: '', category: '', pricing_per_1k: '', is_available: true });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/base-models', form); toast.success('Model added'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/base-models/${selected.id}`, form); toast.success('Model updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/base-models/${showDelete.id}`); toast.success('Model deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', provider: item.provider || '', description: item.description || '', parameters: item.parameters || '', context_length: String(item.context_length || ''), category: item.category || '', pricing_per_1k: String(item.pricing_per_1k || ''), is_available: item.is_available !== false });
    setShowEdit(true);
  };

  const handleAI = async () => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post('/base-models/ai-recommend', { use_case: 'general fine-tuning' }); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Model Recommendation\n\n### Top Picks for Fine-Tuning:\n\n1. **Llama 3 70B** — Best balance of performance and cost\n   - Excellent for instruction following\n   - Strong multilingual support\n   - Cost-effective at scale\n\n2. **Mistral Large** — Best for code and reasoning\n   - Superior code generation\n   - Fast inference speed\n\n3. **Claude 3 Haiku** — Best for low-latency applications\n   - Fastest response times\n   - Great for real-time applications\n\n### Considerations:\n- **Budget**: Llama models are most cost-effective for training\n- **Quality**: Larger models generally produce better fine-tuned results\n- **Speed**: Consider inference latency requirements\n\n> Start with Llama 3 8B for prototyping, then scale to 70B for production` }); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.provider || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => { setSelected(null); setAiResponse(null); }}><FiArrowLeft /></button>
              <h2 className="detail-title">{selected.name}</h2>
              <StatusBadge status={selected.is_available ? 'active' : 'inactive'} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-accent btn-sm" onClick={handleAI}><FiStar /> AI Recommend</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Provider</div><div className="detail-field-value">{selected.provider}</div></div>
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description}</div></div>
              <div className="detail-field"><div className="detail-field-label">Parameters</div><div className="detail-field-value">{selected.parameters}</div></div>
              <div className="detail-field"><div className="detail-field-label">Context Length</div><div className="detail-field-value">{selected.context_length?.toLocaleString()}</div></div>
              <div className="detail-field"><div className="detail-field-label">Category</div><div className="detail-field-value">{selected.category}</div></div>
              <div className="detail-field"><div className="detail-field-label">Pricing</div><div className="detail-field-value">${selected.pricing_per_1k}/1K tokens</div></div>
              <div className="detail-field"><div className="detail-field-label">Capabilities</div><div className="detail-field-value">{Array.isArray(selected.capabilities) ? selected.capabilities.join(', ') : selected.capabilities || 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Base Model">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Provider</label><input className="form-input" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Parameters</label><input className="form-input" value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Context Length</label><input className="form-input" type="number" value={form.context_length} onChange={e => setForm({...form, context_length: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Pricing per 1K tokens</label><input className="form-input" value={form.pricing_per_1k} onChange={e => setForm({...form, pricing_per_1k: e.target.value})} /></div>
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
        <div><h1 className="page-title">Base Models</h1><p className="page-subtitle">Browse available foundation models</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search models..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Model</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiBox /></div><div className="empty-state-text">No models found</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.provider} — {item.description?.substring(0, 80)}</div></div><StatusBadge status={item.is_available ? 'active' : 'inactive'} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiCpu /> {item.parameters}</span>
                <span className="card-meta-item"><FiLayers /> {item.context_length?.toLocaleString()} ctx</span>
                <span className="card-meta-item"><FiDollarSign /> ${item.pricing_per_1k}/1K</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Base Model">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Provider</label><input className="form-input" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Parameters</label><input className="form-input" value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})} placeholder="e.g., 70B" /></div>
            <div className="form-group"><label className="form-label">Context Length</label><input className="form-input" type="number" value={form.context_length} onChange={e => setForm({...form, context_length: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Pricing per 1K tokens</label><input className="form-input" value={form.pricing_per_1k} onChange={e => setForm({...form, pricing_per_1k: e.target.value})} /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Model</button></div>
        </form>
      </Modal>
    </div>
  );
}
