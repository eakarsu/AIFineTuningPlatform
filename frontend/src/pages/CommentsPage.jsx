import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { FiMessageSquare, FiPlus, FiEdit2, FiTrash2, FiCornerDownRight, FiUser, FiClock } from 'react-icons/fi';

export default function CommentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ resource_type: 'fine_tuning_job', resource_id: '', content: '', parent_id: '' });
  const [editForm, setEditForm] = useState({ content: '' });
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/comments'); setItems(res.data.data || res.data.comments || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ resource_type: 'fine_tuning_job', resource_id: '', content: '', parent_id: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.parent_id) delete payload.parent_id;
    try { await api.post('/comments', payload); toast.success('Comment posted'); setShowCreate(false); setReplyTo(null); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/comments/${showEdit.id}`, editForm); toast.success('Comment updated'); setShowEdit(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/comments/${showDelete.id}`); toast.success('Comment deleted'); setShowDelete(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openReply = (item) => {
    setReplyTo(item);
    setForm({ resource_type: item.resource_type, resource_id: String(item.resource_id), content: '', parent_id: String(item.id) });
    setShowCreate(true);
  };

  const openEdit = (item) => {
    setEditForm({ content: item.content || '' });
    setShowEdit(item);
  };

  const resourceTypes = ['all', 'fine_tuning_job', 'dataset', 'deployment', 'custom_model', 'evaluation'];

  const filtered = items.filter(i => filterType === 'all' || i.resource_type === filterType);

  const topLevel = filtered.filter(i => !i.parent_id);
  const replies = filtered.filter(i => i.parent_id);

  const getReplies = (parentId) => replies.filter(r => r.parent_id === parentId);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Comments</h1><p className="page-subtitle">Discussion across all resources</p></div>
        <div className="page-actions">
          <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 160 }}>
            {resourceTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Resources' : t.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { resetForm(); setReplyTo(null); setShowCreate(true); }}><FiPlus /> New Comment</button>
        </div>
      </div>
      {topLevel.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiMessageSquare /></div><div className="empty-state-text">No comments</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {topLevel.map(item => (
            <div key={item.id}>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FiUser style={{ opacity: 0.6 }} />
                      <strong>{item.user_name || item.user?.name || `User #${item.user_id}`}</strong>
                      <span className="card-meta-item" style={{ fontSize: '0.85rem' }}><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>{item.content}</div>
                    <div className="card-meta">
                      <span className="card-meta-item" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{(item.resource_type || '').replace(/_/g, ' ')} #{item.resource_id}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openReply(item)} title="Reply"><FiCornerDownRight /></button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)} title="Edit"><FiEdit2 /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(item)} title="Delete"><FiTrash2 /></button>
                  </div>
                </div>
              </div>
              {getReplies(item.id).map(reply => (
                <div key={reply.id} className="card" style={{ padding: '1rem', marginLeft: '2rem', marginTop: '0.5rem', borderLeft: '3px solid var(--primary-color, #6366f1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FiCornerDownRight style={{ opacity: 0.5 }} />
                        <FiUser style={{ opacity: 0.6 }} />
                        <strong>{reply.user_name || reply.user?.name || `User #${reply.user_id}`}</strong>
                        <span className="card-meta-item" style={{ fontSize: '0.85rem' }}><FiClock /> {reply.created_at ? new Date(reply.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div>{reply.content}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(reply)} title="Edit"><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(reply)} title="Delete"><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setReplyTo(null); }} title={replyTo ? `Reply to Comment #${replyTo.id}` : 'New Comment'}>
        <form onSubmit={handleCreate}>
          {!replyTo && (
            <div className="form-row">
              <div className="form-group"><label className="form-label">Resource Type</label>
                <select className="form-select" value={form.resource_type} onChange={e => setForm({...form, resource_type: e.target.value})}>
                  <option value="fine_tuning_job">Fine Tuning Job</option>
                  <option value="dataset">Dataset</option>
                  <option value="deployment">Deployment</option>
                  <option value="custom_model">Custom Model</option>
                  <option value="evaluation">Evaluation</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Resource ID</label><input className="form-input" value={form.resource_id} onChange={e => setForm({...form, resource_id: e.target.value})} required /></div>
            </div>
          )}
          <div className="form-group"><label className="form-label">Content</label><textarea className="form-textarea" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setReplyTo(null); }}>Cancel</button><button type="submit" className="btn btn-primary">{replyTo ? 'Reply' : 'Post Comment'}</button></div>
        </form>
      </Modal>
      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Comment">
        <form onSubmit={handleEdit}>
          <div className="form-group"><label className="form-label">Content</label><textarea className="form-textarea" rows={4} value={editForm.content} onChange={e => setEditForm({...editForm, content: e.target.value})} required /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Comment" message="Delete this comment?" />
    </div>
  );
}
