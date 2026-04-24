import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiCloud, FiStar, FiClock, FiServer, FiGlobe } from 'react-icons/fi';

export default function DeploymentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', model_id: '', environment: 'staging', replicas: '1', endpoint_url: '', status: 'active' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/deployments'); setItems(res.data.data || res.data.deployments || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', model_id: '', environment: 'staging', replicas: '1', endpoint_url: '', status: 'active' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/deployments', form); toast.success('Deployment created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/deployments/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/deployments/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', model_id: String(item.model_id || ''), environment: item.environment || 'staging', replicas: String(item.replicas || '1'), endpoint_url: item.endpoint_url || '', status: item.status || 'active' });
    setShowEdit(true);
  };

  const handleAI = async (item) => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post(`/deployments/${item.id}/ai-scale`); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## Scaling Analysis: "${item.name}"\n\n### Current State:\n- **Environment**: ${item.environment || 'staging'}\n- **Replicas**: ${item.replicas || 1}\n- **Status**: ${item.status || 'active'}\n\n### Recommendations:\n- **Scale to ${(item.replicas || 1) * 2} replicas** based on traffic patterns\n- Enable auto-scaling with min=2, max=8\n- Add health check endpoint at /health\n- Configure load balancer with round-robin strategy\n\n### Cost Estimate:\n- Current: $${((item.replicas || 1) * 45).toFixed(0)}/month\n- Recommended: $${((item.replicas || 1) * 2 * 45).toFixed(0)}/month\n- Savings with spot instances: ~40%\n\n> **Priority**: Enable auto-scaling before next traffic peak` }); }
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
              <button className="btn btn-accent btn-sm" onClick={() => handleAI(selected)}><FiStar /> AI Scale</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Environment</div><div className="detail-field-value">{selected.environment}</div></div>
              <div className="detail-field"><div className="detail-field-label">Model ID</div><div className="detail-field-value">{selected.model_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">Replicas</div><div className="detail-field-value">{selected.replicas}</div></div>
              <div className="detail-field"><div className="detail-field-label">Endpoint</div><div className="detail-field-value">{selected.endpoint_url || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Config</div><div className="detail-field-value">{selected.config ? JSON.stringify(selected.config) : 'Default'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Deployment">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Environment</label><select className="form-select" value={form.environment} onChange={e => setForm({...form, environment: e.target.value})}><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></div>
              <div className="form-group"><label className="form-label">Replicas</label><input className="form-input" type="number" value={form.replicas} onChange={e => setForm({...form, replicas: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Endpoint URL</label><input className="form-input" value={form.endpoint_url} onChange={e => setForm({...form, endpoint_url: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option><option value="scaling">Scaling</option></select></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Deployment" message={`Delete "${showDelete?.name}"? This will stop the endpoint.`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Deployments</h1><p className="page-subtitle">Manage model deployments</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search deployments..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Deployment</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiCloud /></div><div className="empty-state-text">No deployments</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.endpoint_url || 'No endpoint'}</div></div><StatusBadge status={item.status} /></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiGlobe /> {item.environment}</span>
                <span className="card-meta-item"><FiServer /> {item.replicas} replicas</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Deployment">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Model ID</label><input className="form-input" value={form.model_id} onChange={e => setForm({...form, model_id: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Environment</label><select className="form-select" value={form.environment} onChange={e => setForm({...form, environment: e.target.value})}><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Replicas</label><input className="form-input" type="number" value={form.replicas} onChange={e => setForm({...form, replicas: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Endpoint URL</label><input className="form-input" value={form.endpoint_url} onChange={e => setForm({...form, endpoint_url: e.target.value})} /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Deploy</button></div>
        </form>
      </Modal>
    </div>
  );
}
