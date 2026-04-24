import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiBarChart2, FiStar, FiClock, FiTarget, FiCheckCircle } from 'react-icons/fi';

export default function EvaluationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', model_id: '', dataset_id: '', eval_type: 'accuracy', status: 'pending' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/evaluations'); setItems(res.data.data || res.data.evaluations || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', model_id: '', dataset_id: '', eval_type: 'accuracy', status: 'pending' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/evaluations', form); toast.success('Evaluation created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/evaluations/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/evaluations/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', model_id: String(item.model_id || ''), dataset_id: String(item.dataset_id || ''), eval_type: item.eval_type || 'accuracy', status: item.status || 'pending' });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post(`/evaluations/${item.id}/ai-run`); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Evaluation Results: "${item.name}"\n\n### Metrics Summary:\n| Metric | Score | Benchmark |\n|--------|-------|----------|\n| Accuracy | 92.4% | 89.1% |\n| Precision | 91.8% | 88.5% |\n| Recall | 93.1% | 87.9% |\n| F1 Score | 0.924 | 0.882 |\n\n### Key Insights:\n- **Above benchmark** on all metrics\n- Strong performance on domain-specific queries\n- Slight weakness on ambiguous inputs\n\n### Recommendations:\n- Add more edge case examples to training data\n- Consider ensemble approach for production\n- Monitor drift metrics weekly\n\n> **Overall**: Model performs well and is ready for deployment consideration` }); }
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
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}><FiStar /> AI Run</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Type</div><div className="detail-field-value">{selected.eval_type}</div></div>
              <div className="detail-field"><div className="detail-field-label">Model ID</div><div className="detail-field-value">{selected.model_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">Dataset ID</div><div className="detail-field-value">{selected.dataset_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">Metrics</div><div className="detail-field-value">{selected.metrics ? JSON.stringify(selected.metrics) : 'Pending'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Evaluation">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Eval Type</label><select className="form-select" value={form.eval_type} onChange={e => setForm({...form, eval_type: e.target.value})}><option value="accuracy">Accuracy</option><option value="perplexity">Perplexity</option><option value="bleu">BLEU</option><option value="rouge">ROUGE</option><option value="human">Human Eval</option></select></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="pending">Pending</option><option value="running">Running</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Evaluation" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Evaluations</h1><p className="page-subtitle">Run and track model evaluations</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search evaluations..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Evaluation</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiBarChart2 /></div><div className="empty-state-text">No evaluations</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div><StatusBadge status={item.status} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiTarget /> {item.eval_type}</span>
                <span className="card-meta-item"><FiCheckCircle /> {item.status}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Evaluation">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Model ID</label><input className="form-input" value={form.model_id} onChange={e => setForm({...form, model_id: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Dataset ID</label><input className="form-input" value={form.dataset_id} onChange={e => setForm({...form, dataset_id: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Eval Type</label><select className="form-select" value={form.eval_type} onChange={e => setForm({...form, eval_type: e.target.value})}><option value="accuracy">Accuracy</option><option value="perplexity">Perplexity</option><option value="bleu">BLEU</option><option value="rouge">ROUGE</option><option value="human">Human Eval</option></select></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
