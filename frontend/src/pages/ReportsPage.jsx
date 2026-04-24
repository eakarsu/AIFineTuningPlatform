import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiDownload, FiPlay, FiBarChart2 } from 'react-icons/fi';

export default function ReportsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', report_type: 'usage_summary', parameters: '{}', format: 'json' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/reports'); setItems(res.data.data || res.data.reports || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', report_type: 'usage_summary', parameters: '{}', format: 'json' });

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    try { payload.parameters = JSON.parse(form.parameters); } catch { /* send as string */ }
    try { await api.post('/reports', payload); toast.success('Report created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    try { payload.parameters = JSON.parse(form.parameters); } catch { /* send as string */ }
    try { await api.put(`/reports/${selected.id}`, payload); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/reports/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', report_type: item.report_type || 'usage_summary', parameters: item.parameters ? (typeof item.parameters === 'string' ? item.parameters : JSON.stringify(item.parameters, null, 2)) : '{}', format: item.format || 'json' });
    setShowEdit(true);
  };

  const handleGenerate = async (item) => {
    try { await api.post(`/reports/${item.id}/generate`); toast.success('Report generation started'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to generate'); }
  };

  const reportTypes = ['usage_summary', 'benchmark', 'team_activity', 'cost_analysis', 'security_audit', 'data_quality', 'deployment_health', 'comparison'];

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    const resultDisplay = selected.result_data ? (typeof selected.result_data === 'string' ? selected.result_data : JSON.stringify(selected.result_data, null, 2)) : null;
    const paramsDisplay = selected.parameters ? (typeof selected.parameters === 'string' ? selected.parameters : JSON.stringify(selected.parameters, null, 2)) : 'N/A';
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
              {(selected.status === 'pending' || selected.status === 'failed') && (
                <button className="btn btn-primary btn-sm" onClick={() => handleGenerate(selected)}><FiPlay /> Generate</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Report Type</div><div className="detail-field-value">{(selected.report_type || '').replace(/_/g, ' ')}</div></div>
              <div className="detail-field"><div className="detail-field-label">Format</div><div className="detail-field-value">{(selected.format || '').toUpperCase()}</div></div>
              <div className="detail-field"><div className="detail-field-label">Status</div><div className="detail-field-value"><StatusBadge status={selected.status} /></div></div>
              <div className="detail-field"><div className="detail-field-label">Created</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Completed</div><div className="detail-field-value">{selected.completed_at ? new Date(selected.completed_at).toLocaleString() : 'Not yet'}</div></div>
            </div>
            <div className="detail-field" style={{ marginTop: '1rem' }}>
              <div className="detail-field-label">Parameters</div>
              <pre style={{ background: 'var(--bg-secondary, #1e1e2e)', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem' }}>{paramsDisplay}</pre>
            </div>
            {resultDisplay && (
              <div className="detail-field" style={{ marginTop: '1rem' }}>
                <div className="detail-field-label">Result Data</div>
                <pre style={{ background: 'var(--bg-secondary, #1e1e2e)', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '0.85rem', maxHeight: '400px' }}>{resultDisplay}</pre>
              </div>
            )}
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Report">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Report Type</label>
                <select className="form-select" value={form.report_type} onChange={e => setForm({...form, report_type: e.target.value})}>
                  {reportTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Format</label>
                <select className="form-select" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
                  <option value="json">JSON</option><option value="csv">CSV</option><option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Parameters (JSON)</label><textarea className="form-textarea" rows={4} value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})} /></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Report" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-subtitle">Analytics and generated reports</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search reports..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Report</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiBarChart2 /></div><div className="empty-state-text">No reports</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.name}</div>
                  <div className="card-description">{(item.report_type || '').replace(/_/g, ' ')}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item"><FiFileText /> {(item.format || '').toUpperCase()}</span>
                <span className="card-meta-item"><FiBarChart2 /> {(item.report_type || '').replace(/_/g, ' ')}</span>
                <span className="card-meta-item"><FiDownload /> {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Report">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Report Type</label>
              <select className="form-select" value={form.report_type} onChange={e => setForm({...form, report_type: e.target.value})}>
                {reportTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Format</label>
              <select className="form-select" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
                <option value="json">JSON</option><option value="csv">CSV</option><option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Parameters (JSON)</label><textarea className="form-textarea" rows={4} value={form.parameters} onChange={e => setForm({...form, parameters: e.target.value})} /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
