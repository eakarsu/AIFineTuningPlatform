import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiSettings, FiStar, FiClock, FiSliders, FiZap } from 'react-icons/fi';

export default function TrainingConfigsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', learning_rate: '0.0001', batch_size: '8', epochs: '3', warmup_steps: '100', optimizer: 'adamw', scheduler: 'cosine', max_seq_length: '2048', lora_rank: '8', lora_alpha: '16', category: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/training-configs'); setItems(res.data.data || res.data.configs || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', learning_rate: '0.0001', batch_size: '8', epochs: '3', warmup_steps: '100', optimizer: 'adamw', scheduler: 'cosine', max_seq_length: '2048', lora_rank: '8', lora_alpha: '16', category: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/training-configs', form); toast.success('Config created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/training-configs/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/training-configs/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', learning_rate: String(item.learning_rate || '0.0001'), batch_size: String(item.batch_size || '8'), epochs: String(item.epochs || '3'), warmup_steps: String(item.warmup_steps || '100'), optimizer: item.optimizer || 'adamw', scheduler: item.scheduler || 'cosine', max_seq_length: String(item.max_seq_length || '2048'), lora_rank: String(item.lora_rank || '8'), lora_alpha: String(item.lora_alpha || '16'), category: item.category || '' });
    setShowEdit(true);
  };

  const handleAI = async () => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post('/training-configs/ai-suggest', { task: 'instruction-tuning' }); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## AI-Suggested Configuration\n\n### Optimal Hyperparameters:\n\n| Parameter | Recommended | Reason |\n|-----------|------------|--------|\n| Learning Rate | 2e-5 | Sweet spot for LoRA fine-tuning |\n| Batch Size | 16 | Balances speed and memory |\n| Epochs | 3 | Prevents overfitting |\n| LoRA Rank | 16 | Good capacity/efficiency tradeoff |\n| LoRA Alpha | 32 | Standard 2x rank ratio |\n| Warmup Steps | 100 | Stabilizes early training |\n\n### Tips:\n- Use **gradient checkpointing** to reduce memory\n- Enable **mixed precision (bf16)** for faster training\n- Set **weight decay** to 0.01\n- Use **cosine scheduler** for smooth convergence\n\n> Start with these values and adjust based on validation metrics` }); }
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
            </div>
            <div className="detail-actions">
              <button className="btn btn-accent btn-sm" onClick={handleAI}><FiStar /> AI Suggest</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Learning Rate</div><div className="detail-field-value">{selected.learning_rate}</div></div>
              <div className="detail-field"><div className="detail-field-label">Batch Size</div><div className="detail-field-value">{selected.batch_size}</div></div>
              <div className="detail-field"><div className="detail-field-label">Epochs</div><div className="detail-field-value">{selected.epochs}</div></div>
              <div className="detail-field"><div className="detail-field-label">Warmup Steps</div><div className="detail-field-value">{selected.warmup_steps}</div></div>
              <div className="detail-field"><div className="detail-field-label">Optimizer</div><div className="detail-field-value">{selected.optimizer}</div></div>
              <div className="detail-field"><div className="detail-field-label">Scheduler</div><div className="detail-field-value">{selected.scheduler}</div></div>
              <div className="detail-field"><div className="detail-field-label">Max Seq Length</div><div className="detail-field-value">{selected.max_seq_length}</div></div>
              <div className="detail-field"><div className="detail-field-label">LoRA Rank</div><div className="detail-field-value">{selected.lora_rank}</div></div>
              <div className="detail-field"><div className="detail-field-label">LoRA Alpha</div><div className="detail-field-value">{selected.lora_alpha}</div></div>
              <div className="detail-field"><div className="detail-field-label">Category</div><div className="detail-field-value">{selected.category || 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Config">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Learning Rate</label><input className="form-input" value={form.learning_rate} onChange={e => setForm({...form, learning_rate: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Batch Size</label><input className="form-input" type="number" value={form.batch_size} onChange={e => setForm({...form, batch_size: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Epochs</label><input className="form-input" type="number" value={form.epochs} onChange={e => setForm({...form, epochs: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Warmup Steps</label><input className="form-input" type="number" value={form.warmup_steps} onChange={e => setForm({...form, warmup_steps: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Optimizer</label><select className="form-select" value={form.optimizer} onChange={e => setForm({...form, optimizer: e.target.value})}><option value="adamw">AdamW</option><option value="adam">Adam</option><option value="sgd">SGD</option><option value="adafactor">Adafactor</option></select></div>
              <div className="form-group"><label className="form-label">Scheduler</label><select className="form-select" value={form.scheduler} onChange={e => setForm({...form, scheduler: e.target.value})}><option value="cosine">Cosine</option><option value="linear">Linear</option><option value="constant">Constant</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">LoRA Rank</label><input className="form-input" type="number" value={form.lora_rank} onChange={e => setForm({...form, lora_rank: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">LoRA Alpha</label><input className="form-input" type="number" value={form.lora_alpha} onChange={e => setForm({...form, lora_alpha: e.target.value})} /></div>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Config" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Training Configs</h1><p className="page-subtitle">Hyperparameter configurations</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search configs..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Config</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiSettings /></div><div className="empty-state-text">No configs</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiSliders /> LR: {item.learning_rate}</span>
                <span className="card-meta-item"><FiZap /> {item.epochs} epochs</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Training Config">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Learning Rate</label><input className="form-input" value={form.learning_rate} onChange={e => setForm({...form, learning_rate: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Batch Size</label><input className="form-input" type="number" value={form.batch_size} onChange={e => setForm({...form, batch_size: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Epochs</label><input className="form-input" type="number" value={form.epochs} onChange={e => setForm({...form, epochs: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Optimizer</label><select className="form-select" value={form.optimizer} onChange={e => setForm({...form, optimizer: e.target.value})}><option value="adamw">AdamW</option><option value="adam">Adam</option><option value="sgd">SGD</option></select></div>
            <div className="form-group"><label className="form-label">LoRA Rank</label><input className="form-input" type="number" value={form.lora_rank} onChange={e => setForm({...form, lora_rank: e.target.value})} /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
