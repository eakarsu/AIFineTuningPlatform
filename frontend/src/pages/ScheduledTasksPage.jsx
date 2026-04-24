import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiClock, FiPlay, FiPause, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiRefreshCw, FiActivity } from 'react-icons/fi';

export default function ScheduledTasksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', task_type: 'health_check', schedule: '', config: '{}', status: 'active' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/scheduled-tasks'); setItems(res.data.data || res.data.tasks || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', task_type: 'health_check', schedule: '', config: '{}', status: 'active' });

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    try { payload.config = JSON.parse(form.config); } catch { /* send as string */ }
    try { await api.post('/scheduled-tasks', payload); toast.success('Task created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    try { payload.config = JSON.parse(form.config); } catch { /* send as string */ }
    try { await api.put(`/scheduled-tasks/${selected.id}`, payload); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/scheduled-tasks/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', task_type: item.task_type || 'health_check', schedule: item.schedule || '', config: item.config ? (typeof item.config === 'string' ? item.config : JSON.stringify(item.config, null, 2)) : '{}', status: item.status || 'active' });
    setShowEdit(true);
  };

  const handleToggle = async (item) => {
    try { await api.put(`/scheduled-tasks/${item.id}/toggle`); toast.success('Status toggled'); fetchItems(); if (selected?.id === item.id) { const res = await api.get(`/scheduled-tasks/${item.id}`); setSelected(res.data.data || res.data.task || res.data); } }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to toggle'); }
  };

  const handleRun = async (item) => {
    try { await api.post(`/scheduled-tasks/${item.id}/run`); toast.success('Task triggered'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to run'); }
  };

  const taskTypes = ['health_check', 'backup', 'report', 'maintenance', 'evaluation', 'alert', 'validation', 'cleanup', 'monitoring', 'sync'];

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    const configDisplay = selected.config ? (typeof selected.config === 'string' ? selected.config : JSON.stringify(selected.config, null, 2)) : 'N/A';
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
              <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(selected)}>{selected.status === 'active' ? <><FiPause /> Pause</> : <><FiPlay /> Activate</>}</button>
              <button className="btn btn-primary btn-sm" onClick={() => handleRun(selected)}><FiRefreshCw /> Run Now</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Task Type</div><div className="detail-field-value">{(selected.task_type || '').replace(/_/g, ' ')}</div></div>
              <div className="detail-field"><div className="detail-field-label">Schedule</div><div className="detail-field-value">{selected.schedule || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Status</div><div className="detail-field-value"><StatusBadge status={selected.status} /></div></div>
              <div className="detail-field"><div className="detail-field-label">Last Run</div><div className="detail-field-value">{selected.last_run_at ? new Date(selected.last_run_at).toLocaleString() : 'Never'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Next Run</div><div className="detail-field-value">{selected.next_run_at ? new Date(selected.next_run_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Run Count</div><div className="detail-field-value">{selected.run_count ?? 0}</div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
            <div className="detail-field" style={{ marginTop: '1rem' }}>
              <div className="detail-field-label">Config</div>
              <pre style={{ background: 'var(--bg-secondary, #1e1e2e)', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>{configDisplay}</pre>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Scheduled Task">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Task Type</label>
                <select className="form-select" value={form.task_type} onChange={e => setForm({...form, task_type: e.target.value})}>
                  {taskTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Schedule (cron)</label><input className="form-input" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="e.g., 0 */6 * * *" /></div>
            </div>
            <div className="form-group"><label className="form-label">Config (JSON)</label><textarea className="form-textarea" rows={5} value={form.config} onChange={e => setForm({...form, config: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option><option value="paused">Paused</option>
              </select>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Task" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Scheduled Tasks</h1><p className="page-subtitle">Automated recurring tasks</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search tasks..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Task</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiClock /></div><div className="empty-state-text">No scheduled tasks</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name}</div>
                  <div className="card-description">{(item.task_type || '').replace(/_/g, ' ')}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiClock /> {item.schedule || 'No schedule'}</span>
                <span className="card-meta-item"><FiActivity /> Runs: {item.run_count ?? 0}</span>
                <span className="card-meta-item"><FiRefreshCw /> {item.last_run_at ? new Date(item.last_run_at).toLocaleDateString() : 'Never run'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Scheduled Task">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Task Type</label>
              <select className="form-select" value={form.task_type} onChange={e => setForm({...form, task_type: e.target.value})}>
                {taskTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Schedule (cron)</label><input className="form-input" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="e.g., 0 */6 * * *" /></div>
          </div>
          <div className="form-group"><label className="form-label">Config (JSON)</label><textarea className="form-textarea" rows={5} value={form.config} onChange={e => setForm({...form, config: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option><option value="paused">Paused</option>
            </select>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
