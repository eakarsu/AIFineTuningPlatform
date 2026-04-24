import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiDownload, FiDatabase, FiCpu, FiLayers, FiBarChart2, FiCloud, FiSettings, FiGitBranch, FiFileText, FiDollarSign, FiKey } from 'react-icons/fi';

const exportResources = [
  { key: 'datasets', label: 'Datasets', icon: <FiDatabase />, description: 'Export all training datasets and metadata' },
  { key: 'jobs', label: 'Fine-Tuning Jobs', icon: <FiCpu />, description: 'Export all fine-tuning job configurations and results' },
  { key: 'models', label: 'Custom Models', icon: <FiLayers />, description: 'Export all custom model definitions and metrics' },
  { key: 'evaluations', label: 'Evaluations', icon: <FiBarChart2 />, description: 'Export all model evaluation results and benchmarks' },
  { key: 'deployments', label: 'Deployments', icon: <FiCloud />, description: 'Export all deployment configurations and status' },
  { key: 'configs', label: 'Training Configs', icon: <FiSettings />, description: 'Export all training configuration presets' },
  { key: 'pipelines', label: 'Data Pipelines', icon: <FiGitBranch />, description: 'Export all data pipeline definitions and schedules' },
  { key: 'templates', label: 'Prompt Templates', icon: <FiFileText />, description: 'Export all prompt templates and variables' },
  { key: 'billing', label: 'Usage & Billing', icon: <FiDollarSign />, description: 'Export usage records and billing history' },
  { key: 'api-keys', label: 'API Keys', icon: <FiKey />, description: 'Export API key metadata (keys are redacted)' },
];

export default function ExportPage() {
  const [exporting, setExporting] = useState({});

  const handleExport = async (resource) => {
    setExporting(prev => ({ ...prev, [resource.key]: true }));
    try {
      const res = await api.get(`/export/${resource.key}`);
      const data = JSON.stringify(res.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.key}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${resource.label} exported successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to export ${resource.label}`);
    } finally {
      setExporting(prev => ({ ...prev, [resource.key]: false }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Export Data</h1>
          <p className="page-subtitle">Download your data as JSON files</p>
        </div>
      </div>

      <div className="card-grid">
        {exportResources.map(resource => (
          <div className="card" key={resource.key}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#6c63ff', display: 'flex' }}>{resource.icon}</span>
                  {resource.label}
                </div>
                <div className="card-description">{resource.description}</div>
              </div>
            </div>
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleExport(resource)}
                disabled={exporting[resource.key]}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}
              >
                {exporting[resource.key] ? (
                  <>Exporting...</>
                ) : (
                  <><FiDownload /> Export JSON</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
