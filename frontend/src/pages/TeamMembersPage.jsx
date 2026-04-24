import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiUsers, FiClock, FiShield, FiMail } from 'react-icons/fi';

export default function TeamMembersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ user_id: '', team_name: '', role: 'member', status: 'active' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/team-members'); setItems(res.data.data || res.data.members || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ user_id: '', team_name: '', role: 'member', status: 'active' });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/team-members', form); toast.success('Member added'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/team-members/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/team-members/${showDelete.id}`); toast.success('Removed'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ user_id: String(item.user_id || ''), team_name: item.team_name || '', role: item.role || 'member', status: item.status || 'active' });
    setShowEdit(true);
  };

  const getRoleColor = (role) => {
    switch(role) { case 'admin': return '#ff4757'; case 'member': return '#6c63ff'; case 'viewer': return '#a0a0b8'; default: return '#a0a0b8'; }
  };

  const filtered = items.filter(i => (i.team_name || '').toLowerCase().includes(search.toLowerCase()) || (i.role || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (selected) {
    return (
      <div>
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-header-left">
              <button className="detail-back-btn" onClick={() => setSelected(null)}><FiArrowLeft /></button>
              <h2 className="detail-title">{selected.team_name} — Member</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="detail-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Remove</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Team</div><div className="detail-field-value">{selected.team_name}</div></div>
              <div className="detail-field"><div className="detail-field-label">User ID</div><div className="detail-field-value">{selected.user_id}</div></div>
              <div className="detail-field"><div className="detail-field-label">Role</div><div className="detail-field-value" style={{color: getRoleColor(selected.role), fontWeight: 600, textTransform: 'capitalize'}}>{selected.role}</div></div>
              <div className="detail-field"><div className="detail-field-label">Status</div><div className="detail-field-value">{selected.status}</div></div>
              <div className="detail-field"><div className="detail-field-label">Invited By</div><div className="detail-field-value">{selected.invited_by || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Joined</div><div className="detail-field-value">{selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}</div></div>
            </div>
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Member">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Team Name</label><input className="form-input" value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Active</option><option value="invited">Invited</option><option value="removed">Removed</option></select></div>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Remove Member" message={`Remove this member from ${showDelete?.team_name}?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Team Management</h1><p className="page-subtitle">Manage team members and roles</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search members..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> Add Member</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiUsers /></div><div className="empty-state-text">No team members</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{item.team_name}</div>
                  <div className="card-description">User #{item.user_id}</div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="card-meta">
                <span className="card-meta-item" style={{color: getRoleColor(item.role)}}><FiShield /> {item.role}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Team Member">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Team Name</label><input className="form-input" value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})} required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">User ID</label><input className="form-input" value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add</button></div>
        </form>
      </Modal>
    </div>
  );
}
