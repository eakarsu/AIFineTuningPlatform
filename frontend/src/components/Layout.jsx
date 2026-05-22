import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import {
  FiHome, FiCpu, FiDatabase, FiBox, FiLayers, FiBarChart2,
  FiKey, FiCloud, FiSettings, FiGitBranch, FiColumns, FiFileText,
  FiDollarSign, FiShield, FiUsers, FiLogOut, FiBell, FiLink, FiTag,
  FiStar, FiMessageSquare, FiClock, FiFile, FiDownloadCloud,
  FiSearch, FiActivity, FiHelpCircle, FiDownload, FiUser, FiTarget, FiAlertTriangle
} from 'react-icons/fi';

const navSections = [
  {
    title: 'Core',
    items: [
      { path: '/', label: 'Dashboard', icon: FiHome },
      { path: '/search', label: 'Global Search', icon: FiSearch },
      { path: '/notifications', label: 'Notifications', icon: FiBell },
      { path: '/favorites', label: 'Favorites', icon: FiStar },
    ],
  },
  {
    title: 'AI & Training',
    items: [
      { path: '/fine-tuning-jobs', label: 'Fine-Tuning Jobs', icon: FiCpu },
      { path: '/datasets', label: 'Training Datasets', icon: FiDatabase },
      { path: '/base-models', label: 'Base Models', icon: FiBox },
      { path: '/custom-models', label: 'Custom Models', icon: FiLayers },
      { path: '/evaluations', label: 'Evaluations', icon: FiBarChart2 },
      { path: '/training-configs', label: 'Training Configs', icon: FiSettings },
      { path: '/model-comparisons', label: 'Model Comparisons', icon: FiColumns },
      { path: '/prompt-templates', label: 'Prompt Templates', icon: FiFileText },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/deployments', label: 'Deployments', icon: FiCloud },
      { path: '/inference', label: 'Inference Playground', icon: FiCpu },
      { path: '/bayesian-search', label: 'Bayesian HP Search', icon: FiTarget },
      { path: '/prompt-ab', label: 'Prompt A/B Tester', icon: FiGitBranch },
      { path: '/deployment-templates', label: 'Deployment Templates', icon: FiCloud },
      { path: '/marketplace', label: 'Model Marketplace', icon: FiBox },
      { path: '/huggingface', label: 'Hugging Face Hub', icon: FiBox },
      { path: '/api-keys', label: 'API Keys', icon: FiKey },
      { path: '/data-pipelines', label: 'Data Pipelines', icon: FiGitBranch },
      { path: '/webhooks', label: 'Webhooks', icon: FiLink },
      { path: '/scheduled-tasks', label: 'Scheduled Tasks', icon: FiClock },
      { path: '/ai-results', label: 'AI Run History', icon: FiActivity },
    ],
  },
  {
    title: 'Training Views',
    items: [
      { path: '/custom-views', label: 'Training Views', icon: FiBarChart2 },
      { path: '/dataset-leakage', label: 'Dataset Leakage', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'Organization',
    items: [
      { path: '/team-members', label: 'Team Management', icon: FiUsers },
      { path: '/tags', label: 'Tags & Labels', icon: FiTag },
      { path: '/comments', label: 'Comments', icon: FiMessageSquare },
      { path: '/files', label: 'File Manager', icon: FiFile },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { path: '/cost-estimator', label: 'Cost Estimator', icon: FiDollarSign },
      { path: '/usage-billing', label: 'Usage & Billing', icon: FiDollarSign },
      { path: '/reports', label: 'Reports', icon: FiBarChart2 },
      { path: '/activity', label: 'Activity Timeline', icon: FiActivity },
      { path: '/audit-logs', label: 'Audit Logs', icon: FiShield },
      { path: '/export', label: 'Export Data', icon: FiDownload },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/backups', label: 'Backups', icon: FiDownloadCloud },
      { path: '/admin-settings', label: 'Admin Settings', icon: FiSettings },
      { path: '/profile', label: 'My Profile', icon: FiUser },
      { path: '/help', label: 'Help Center', icon: FiHelpCircle },
    ],
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">AI</div>
          <div className="sidebar-logo-text">
            Fine<span>Tune</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-nav-section">
              <div className="sidebar-nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar-nav-icon">
                    <item.icon />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
