import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiSettings, FiSave, FiMail } from 'react-icons/fi';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', company: '', role: '', created_at: '' });
  const [profileForm, setProfileForm] = useState({ name: '', company: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [preferences, setPreferences] = useState({ theme: 'dark', timezone: 'UTC', language: 'en', notifications: true, email_notifications: true, items_per_page: 25 });
  const [prefsForm, setPrefsForm] = useState({ theme: 'dark', timezone: 'UTC', language: 'en', notifications: true, email_notifications: true, items_per_page: 25 });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => { fetchProfile(); fetchPreferences(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      const data = res.data.data || res.data.profile || res.data || {};
      setProfile(data);
      setProfileForm({ name: data.name || '', company: data.company || '' });
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/profile/preferences');
      const data = res.data.data || res.data.preferences || res.data || {};
      setPreferences(data);
      setPrefsForm({ theme: data.theme || 'dark', timezone: data.timezone || 'UTC', language: data.language || 'en', notifications: data.notifications !== false, email_notifications: data.email_notifications !== false, items_per_page: data.items_per_page || 25 });
    } catch { /* ignore */ }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try { await api.put('/profile', profileForm); toast.success('Profile updated'); setEditingProfile(false); fetchProfile(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to update profile'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (passwordForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try { await api.put('/profile/password', { current_password: passwordForm.current_password, new_password: passwordForm.new_password }); toast.success('Password changed'); setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
  };

  const handlePrefsSave = async (e) => {
    e.preventDefault();
    try { await api.put('/profile/preferences', prefsForm); toast.success('Preferences saved'); setPreferences(prefsForm); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to save preferences'); }
  };

  const timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Profile</h1><p className="page-subtitle">Manage your account settings and preferences</p></div>
      </div>

      {/* Profile Info Section */}
      <div className="detail-view" style={{ marginBottom: '24px' }}>
        <div className="detail-header">
          <div className="detail-header-left">
            <FiUser style={{ fontSize: '20px', color: '#6c63ff' }} />
            <h2 className="detail-title">Profile Information</h2>
          </div>
          <div className="detail-actions">
            {!editingProfile && <button className="btn btn-secondary btn-sm" onClick={() => setEditingProfile(true)}><FiSettings /> Edit</button>}
          </div>
        </div>
        <div className="detail-body">
          {editingProfile ? (
            <form onSubmit={handleProfileSave}>
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Email (read-only)</label><input className="form-input" value={profile.email || ''} disabled style={{ opacity: 0.6 }} /></div>
              <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={profileForm.company} onChange={e => setProfileForm({ ...profileForm, company: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Role (read-only)</label><input className="form-input" value={profile.role || ''} disabled style={{ opacity: 0.6 }} /></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button><button type="submit" className="btn btn-primary"><FiSave /> Save</button></div>
            </form>
          ) : (
            <div className="detail-grid">
              <div className="detail-field"><div className="detail-field-label">Name</div><div className="detail-field-value">{profile.name || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Email</div><div className="detail-field-value"><FiMail style={{ marginRight: '6px' }} />{profile.email || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Company</div><div className="detail-field-value">{profile.company || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Role</div><div className="detail-field-value">{profile.role || 'N/A'}</div></div>
              <div className="detail-field"><div className="detail-field-label">Member Since</div><div className="detail-field-value">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="detail-view" style={{ marginBottom: '24px' }}>
        <div className="detail-header">
          <div className="detail-header-left">
            <FiLock style={{ fontSize: '20px', color: '#ff4757' }} />
            <h2 className="detail-title">Change Password</h2>
          </div>
        </div>
        <div className="detail-body">
          <form onSubmit={handlePasswordChange}>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} required /></div>
            </div>
            <div className="form-actions"><button type="submit" className="btn btn-primary"><FiLock /> Change Password</button></div>
          </form>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="detail-view">
        <div className="detail-header">
          <div className="detail-header-left">
            <FiSettings style={{ fontSize: '20px', color: '#00d4aa' }} />
            <h2 className="detail-title">Preferences</h2>
          </div>
        </div>
        <div className="detail-body">
          <form onSubmit={handlePrefsSave}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Theme</label><select className="form-select" value={prefsForm.theme} onChange={e => setPrefsForm({ ...prefsForm, theme: e.target.value })}><option value="dark">Dark</option><option value="light">Light</option></select></div>
              <div className="form-group"><label className="form-label">Language</label><select className="form-select" value={prefsForm.language} onChange={e => setPrefsForm({ ...prefsForm, language: e.target.value })}><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="ja">Japanese</option><option value="zh">Chinese</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Timezone</label><select className="form-select" value={prefsForm.timezone} onChange={e => setPrefsForm({ ...prefsForm, timezone: e.target.value })}>{timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Items Per Page</label><select className="form-select" value={prefsForm.items_per_page} onChange={e => setPrefsForm({ ...prefsForm, items_per_page: Number(e.target.value) })}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></div>
            </div>
            <div className="form-group"><label className="form-label"><input type="checkbox" checked={prefsForm.notifications} onChange={e => setPrefsForm({ ...prefsForm, notifications: e.target.checked })} style={{ marginRight: '8px' }} />Enable Notifications</label></div>
            <div className="form-group"><label className="form-label"><input type="checkbox" checked={prefsForm.email_notifications} onChange={e => setPrefsForm({ ...prefsForm, email_notifications: e.target.checked })} style={{ marginRight: '8px' }} />Enable Email Notifications</label></div>
            <div className="form-actions"><button type="submit" className="btn btn-primary"><FiSave /> Save Preferences</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
