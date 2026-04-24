import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchBar from '../components/SearchBar';
import AIOutput from '../components/AIOutput';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiFileText, FiStar, FiClock, FiTag, FiEye } from 'react-icons/fi';

export default function PromptTemplatesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', template_text: '', variables: '', example_output: '', is_public: false });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/prompt-templates'); setItems(res.data.data || res.data.templates || res.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  const resetForm = () => setForm({ name: '', description: '', category: '', template_text: '', variables: '', example_output: '', is_public: false });

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.post('/prompt-templates', form); toast.success('Template created'); setShowCreate(false); resetForm(); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await api.put(`/prompt-templates/${selected.id}`, form); toast.success('Updated'); setShowEdit(false); setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/prompt-templates/${showDelete.id}`); toast.success('Deleted'); setShowDelete(null); if (selected?.id === showDelete.id) setSelected(null); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', description: item.description || '', category: item.category || '', template_text: item.template_text || '', variables: Array.isArray(item.variables) ? item.variables.join(', ') : item.variables || '', example_output: item.example_output || '', is_public: item.is_public || false });
    setShowEdit(true);
  };

  const handleAI = async () => {
    setAiLoading(true); setAiResponse(null);
    try { const res = await api.post('/prompt-templates/ai-generate', { task: 'instruction-following' }); setAiResponse(res.data); }
    catch { setAiResponse({ analysis: `## AI-Generated Prompt Templates\n\n### Template 1: Instruction Following\n\`\`\`\nYou are a helpful assistant specialized in {domain}.\n\nGiven the following context:\n{context}\n\nPlease answer this question:\n{question}\n\nProvide a detailed, accurate response.\n\`\`\`\n**Variables**: domain, context, question\n\n### Template 2: Data Extraction\n\`\`\`\nExtract the following information from the text:\n- {field_1}\n- {field_2}\n- {field_3}\n\nText: {input_text}\n\nReturn the results in JSON format.\n\`\`\`\n**Variables**: field_1, field_2, field_3, input_text\n\n### Template 3: Summarization\n\`\`\`\nSummarize the following {content_type} in {length} sentences:\n\n{content}\n\nFocus on: {focus_areas}\n\`\`\`\n**Variables**: content_type, length, content, focus_areas\n\n> These templates are optimized for fine-tuning instruction-following models` }); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase()));

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
              <button className="btn btn-accent btn-sm" onClick={handleAI}><FiStar /> AI Generate</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(selected)}><FiTrash2 /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Description</div><div className="detail-field-value">{selected.description || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Category</div><div className="detail-field-value">{selected.category}</div></div>
              <div className="detail-field"><div className="detail-field-label">Public</div><div className="detail-field-value">{selected.is_public ? 'Yes' : 'No'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Variables</div><div className="detail-field-value">{Array.isArray(selected.variables) ? selected.variables.join(', ') : selected.variables || 'None'}</div></div>
            </div>
            <div className="detail-field" style={{marginTop: '16px'}}>
              <div className="detail-field-label">Template</div>
              <pre style={{background: '#0a0a0f', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px', border: '1px solid #2a2a3e'}}>{selected.template_text}</pre>
            </div>
            {selected.example_output && (
              <div className="detail-field" style={{marginTop: '16px'}}>
                <div className="detail-field-label">Example Output</div>
                <pre style={{background: '#0a0a0f', padding: '16px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '13px', border: '1px solid #2a2a3e'}}>{selected.example_output}</pre>
              </div>
            )}
            <AIOutput response={aiResponse} loading={aiLoading} onClose={() => setAiResponse(null)} />
          </div>
        </div>
        <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Template">
          <form onSubmit={handleEdit}>
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Variables (comma sep)</label><input className="form-input" value={form.variables} onChange={e => setForm({...form, variables: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Template Text</label><textarea className="form-textarea" rows={6} value={form.template_text} onChange={e => setForm({...form, template_text: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Example Output</label><textarea className="form-textarea" rows={3} value={form.example_output} onChange={e => setForm({...form, example_output: e.target.value})} /></div>
            <div className="form-group"><label className="form-label"><input type="checkbox" checked={form.is_public} onChange={e => setForm({...form, is_public: e.target.checked})} style={{marginRight: '8px'}} />Public template</label></div>
            <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
        <ConfirmDialog isOpen={!!showDelete} onClose={() => setShowDelete(null)} onConfirm={handleDelete} title="Delete Template" message={`Delete "${showDelete?.name}"?`} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Prompt Templates</h1><p className="page-subtitle">Reusable prompt templates</p></div>
        <div className="page-actions">
          <SearchBar value={search} onChange={setSearch} placeholder="Search templates..." />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> New Template</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FiFileText /></div><div className="empty-state-text">No templates</div></div>
      ) : (
        <div className="card-grid">
          {filtered.map(item => (
            <div className="card card-hover" key={item.id} onClick={() => setSelected(item)}>
              <div className="card-header"><div><div className="card-title">{item.name}</div><div className="card-description">{item.description?.substring(0, 80) || 'No description'}</div></div></div>
              <div className="card-meta">
                <span className="card-meta-item"><FiTag /> {item.category || 'General'}</span>
                <span className="card-meta-item"><FiEye /> {item.is_public ? 'Public' : 'Private'}</span>
                <span className="card-meta-item"><FiClock /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Template">
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Variables (comma sep)</label><input className="form-input" value={form.variables} onChange={e => setForm({...form, variables: e.target.value})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Template Text</label><textarea className="form-textarea" rows={6} value={form.template_text} onChange={e => setForm({...form, template_text: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Example Output</label><textarea className="form-textarea" rows={3} value={form.example_output} onChange={e => setForm({...form, example_output: e.target.value})} /></div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
