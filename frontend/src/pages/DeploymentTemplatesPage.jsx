import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FiCloud, FiZap, FiTrash2 } from 'react-icons/fi';

export default function DeploymentTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', environment: 'production',
    replicas: 2, gpu_class: 'A100',
    auto_scale_min: 1, auto_scale_max: 5,
  });
  const [deployTarget, setDeployTarget] = useState({ template_id: '', custom_model_id: '' });
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/deployment-templates');
      setTemplates(r.data || []);
    } catch (e) { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/deployment-templates', form);
      setMsg(`Template "${form.name}" created.`);
      setForm({ ...form, name: '', description: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || err.message);
    }
  };

  const remove = async (id) => {
    await api.delete(`/deployment-templates/${id}`);
    load();
  };

  const deployFromTemplate = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const r = await api.post(`/deployment-templates/${deployTarget.template_id}/deploy`, {
        custom_model_id: Number(deployTarget.custom_model_id),
      });
      setResult(r.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiCloud /> Deployment Templates</h1>
      <p style={{ color: '#6b7280' }}>Reusable presets (replicas, GPU class, scaling). One-click materialize to a deployment record.</p>

      <h2>Templates {loading && '(loading…)'}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>ID</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Env</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Replicas</th>
            <th style={{ padding: 8, textAlign: 'left' }}>GPU</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Scale</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {templates.length === 0 ? <tr><td colSpan="7" style={{ padding: 12, color: '#9ca3af' }}>No templates yet</td></tr> :
            templates.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 8 }}>{t.id}</td>
                <td style={{ padding: 8 }}>{t.name}</td>
                <td style={{ padding: 8 }}>{t.environment}</td>
                <td style={{ padding: 8 }}>{t.replicas}</td>
                <td style={{ padding: 8 }}>{t.gpu_class || '—'}</td>
                <td style={{ padding: 8 }}>{t.auto_scale_min}-{t.auto_scale_max}</td>
                <td style={{ padding: 8 }}><button onClick={() => remove(t.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px' }}><FiTrash2 /></button></td>
              </tr>
            ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <form onSubmit={create} style={{ flex: 1, minWidth: 320, background: '#f9fafb', padding: 16, borderRadius: 8 }}>
          <h3>Create Template</h3>
          {['name', 'description', 'environment', 'gpu_class'].map((k) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12 }}>{k}</label>
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          ))}
          {['replicas', 'auto_scale_min', 'auto_scale_max'].map((k) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12 }}>{k}</label>
              <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: parseInt(e.target.value, 10) || 0 })}
                style={{ width: 120, padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          ))}
          <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}>Create</button>
          {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
        </form>

        <form onSubmit={deployFromTemplate} style={{ flex: 1, minWidth: 320, background: '#eff6ff', padding: 16, borderRadius: 8 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiZap /> One-Click Deploy</h3>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12 }}>Template ID</label>
            <input required value={deployTarget.template_id} onChange={(e) => setDeployTarget({ ...deployTarget, template_id: e.target.value })}
              style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12 }}>Custom Model ID</label>
            <input required value={deployTarget.custom_model_id} onChange={(e) => setDeployTarget({ ...deployTarget, custom_model_id: e.target.value })}
              style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6 }}>Deploy</button>
          {result && (
            <pre style={{ marginTop: 8, padding: 8, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </form>
      </div>
    </div>
  );
}
