import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiSettings, FiEdit2, FiSave, FiX, FiShield, FiMail, FiServer, FiCloud, FiDatabase, FiFileText } from 'react-icons/fi';

const categories = [
  { key: 'general', label: 'General', icon: <FiSettings /> },
  { key: 'security', label: 'Security', icon: <FiShield /> },
  { key: 'email', label: 'Email', icon: <FiMail /> },
  { key: 'training', label: 'Training', icon: <FiServer /> },
  { key: 'deployment', label: 'Deployment', icon: <FiCloud /> },
  { key: 'backup', label: 'Backup', icon: <FiDatabase /> },
  { key: 'logging', label: 'Logging', icon: <FiFileText /> },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { fetchSettings(); }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/system-settings?category=${activeTab}`);
      setSettings(res.data.data || res.data.settings || res.data || []);
    } catch {
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key) => {
    try {
      await api.put(`/system-settings/${key}`, { value: editValue });
      toast.success('Setting updated');
      setEditingKey(null);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update setting');
    }
  };

  const startEdit = (setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value || '');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-subtitle">Manage system configuration</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`btn ${activeTab === cat.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveTab(cat.key); setEditingKey(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : settings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiSettings /></div>
          <div className="empty-state-text">No settings found for this category</div>
        </div>
      ) : (
        <div className="card">
          <div style={{ padding: '1.5rem' }}>
            {settings.map((setting, idx) => (
              <div
                key={setting.key || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 0',
                  borderBottom: idx < settings.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, color: '#e0e0ff', marginBottom: '0.25rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{setting.key}</div>
                  <div style={{ fontSize: '0.85rem', color: '#a0a0b8' }}>{setting.description || 'No description'}</div>
                </div>
                <div style={{ flex: '1 1 200px', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingKey === setting.key ? (
                    <>
                      <input
                        className="form-input"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSave(setting.key)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiSave /> Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiX /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        color: '#c0c0e0',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        wordBreak: 'break-all'
                      }}>
                        {setting.value || '(empty)'}
                      </span>
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(setting)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiEdit2 /> Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
