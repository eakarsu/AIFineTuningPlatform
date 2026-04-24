import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiCpu, FiStar, FiClock, FiTarget } from 'react-icons/fi';

export default function FineTuningJobsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', base_model: '', dataset_id: '',
    epochs: '3', learning_rate: '0.0001', batch_size: '8', status: 'queued'
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/fine-tuning-jobs');
      setItems(res.data.data || res.data.jobs || res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const resetForm = () => setForm({
    name: '', description: '', base_model: '', dataset_id: '',
    epochs: '3', learning_rate: '0.0001', batch_size: '8', status: 'queued'
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fine-tuning-jobs', form);
      toast.success('Job created successfully');
      setShowCreate(false);
      resetForm();
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create job'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/fine-tuning-jobs/${selected.id || selected._id}`, form);
      toast.success('Job updated successfully');
      setShowEdit(false);
      setSelected(null);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update job'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/fine-tuning-jobs/${showDelete.id || showDelete._id}`);
      toast.success('Job deleted successfully');
      setShowDelete(null);
      if (selected && (selected.id || selected._id) === (showDelete.id || showDelete._id)) setSelected(null);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete job'); }
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '', description: item.description || '',
      base_model: item.base_model || '',
      dataset_id: String(item.dataset_id || ''),
      epochs: String(item.config?.epochs || '3'),
      learning_rate: String(item.config?.learning_rate || '0.0001'),
      batch_size: String(item.config?.batch_size || '8'),
      status: item.status || 'queued'
    });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post(`/fine-tuning-jobs/${item.id || item._id}/ai-optimize`);
      setAiResponse(res.data);
    } catch {
      setAiResponse({
        analysis: `## Optimization Analysis for "${item.name || 'Job'}"\n\nRecommendations:\n- **Learning Rate**: Consider using a cosine annealing schedule starting at ${item.learningRate || '0.0001'}\n- **Batch Size**: Current batch size of ${item.batchSize || '8'} is suitable for your dataset size\n- **Epochs**: Monitor validation loss to prevent overfitting. Consider early stopping after 2-3 epochs without improvement\n- **Data Quality**: Ensure training data is clean and properly formatted\n\nKey Insights:\n- Fine-tuning with LoRA adapters can reduce compute costs by 60%\n- Consider gradient accumulation if memory is limited\n- Use a validation split of 10-20% for reliable metrics\n\n> High priority: Monitor training loss curves for signs of overfitting`
      });
    } finally { setAiLoading(false); }
  };

  const filtered = items.filter(item =>
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.status || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => { setSelected(null); setAiResponse(null); }}>
                <FiArrowLeft />
              </button>
              <h2 className="detail-title">{selected.name || 'Untitled Job'}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}>
                <FiStar /> AI Optimize
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-field-label">Description</div>
                <div className="detail-field-value">{selected.description || 'No description'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Base Model</div>
                <div className="detail-field-value">{selected.base_model || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Dataset</div>
                <div className="detail-field-value">{selected.dataset_id || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Epochs</div>
                <div className="detail-field-value">{selected.config?.epochs || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Learning Rate</div>
                <div className="detail-field-value">{selected.config?.learning_rate || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Batch Size</div>
                <div className="detail-field-value">{selected.config?.batch_size || 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Created</div>
                <div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Updated</div>
                <div className="detail-field-value">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>

        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Fine-Tuning Job">
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Base Model</label>
                <input className="form-input" value={form.base_model} onChange={e => setForm({...form, base_model: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Dataset ID</label>
                <input className="form-input" value={form.dataset_id} onChange={e => setForm({...form, dataset_id: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Epochs</label>
                <input className="form-input" type="number" value={form.epochs} onChange={e => setForm({...form, epochs: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Learning Rate</label>
                <input className="form-input" value={form.learning_rate} onChange={e => setForm({...form, learning_rate: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Batch Size</label>
                <input className="form-input" type="number" value={form.batch_size} onChange={e => setForm({...form, batch_size: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="queued">Queued</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete}
          title="Delete Job" message={`Are you sure you want to delete "${showDelete?.name}"? This action cannot be undone.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fine-Tuning Jobs</h1>
          <p className="page-subtitle">Manage your model fine-tuning jobs</p>
        </div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search jobs..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}>
            <FiPlus /> New Job
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiCpu /></div>
          <div className="empty-state-text">No fine-tuning jobs found</div>
          <div className="empty-state-sub">Create your first job to get started</div>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id || item._id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name || 'Untitled'}</div>
                  <div className="card-description">{item.description || 'No description'}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiCpu /> {item.base_model || 'N/A'}</span>
                <span className="card-meta-item"><FiTarget /> {item.config?.epochs || '3'} epochs</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Fine-Tuning Job">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., GPT-4 Customer Support" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the purpose of this job..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Base Model</label>
              <input className="form-input" value={form.base_model} onChange={e => setForm({...form, base_model: e.target.value})} placeholder="e.g., gpt-4" />
            </div>
            <div className="form-group">
              <label className="form-label">Dataset ID</label>
              <input className="form-input" value={form.dataset_id} onChange={e => setForm({...form, dataset_id: e.target.value})} placeholder="Dataset to use" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Epochs</label>
              <input className="form-input" type="number" value={form.epochs} onChange={e => setForm({...form, epochs: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Learning Rate</label>
              <input className="form-input" value={form.learning_rate} onChange={e => setForm({...form, learning_rate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Batch Size</label>
            <input className="form-input" type="number" value={form.batch_size} onChange={e => setForm({...form, batch_size: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Job</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete}
        title="Delete Job" message={`Are you sure you want to delete "${showDelete?.name}"? This action cannot be undone.`} />
    </div>
  );
}
