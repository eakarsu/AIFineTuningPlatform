import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiCpu, FiDatabase, FiLayers, FiCloud, FiBarChart2, FiActivity, FiKey, FiUsers, FiSettings, FiFileText } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#6c63ff', '#00d4aa', '#ffa502', '#ff4757', '#3b82f6'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const jobsTotal = stats?.fine_tuning_jobs?.total || 0;
  const datasetsTotal = stats?.training_datasets || 0;
  const modelsTotal = stats?.custom_models?.total || 0;
  const deploymentsTotal = stats?.deployments?.total || 0;
  const evaluationsTotal = stats?.evaluations || 0;
  const apiKeysTotal = stats?.active_api_keys || 0;
  const configsTotal = stats?.training_configs || 0;
  const pipelinesTotal = stats?.data_pipelines || 0;
  const templatesTotal = stats?.prompt_templates || 0;
  const teamTotal = stats?.active_team_members || 0;

  const statCards = [
    { label: 'Fine-Tuning Jobs', value: jobsTotal, icon: FiCpu, color: '#6c63ff' },
    { label: 'Datasets', value: datasetsTotal, icon: FiDatabase, color: '#00d4aa' },
    { label: 'Custom Models', value: modelsTotal, icon: FiLayers, color: '#ffa502' },
    { label: 'Deployments', value: deploymentsTotal, icon: FiCloud, color: '#3b82f6' },
    { label: 'Evaluations', value: evaluationsTotal, icon: FiBarChart2, color: '#ff4757' },
    { label: 'Active API Keys', value: apiKeysTotal, icon: FiKey, color: '#6c63ff' },
    { label: 'Training Configs', value: configsTotal, icon: FiSettings, color: '#00d4aa' },
    { label: 'Data Pipelines', value: pipelinesTotal, icon: FiActivity, color: '#ffa502' },
    { label: 'Prompt Templates', value: templatesTotal, icon: FiFileText, color: '#3b82f6' },
    { label: 'Team Members', value: teamTotal, icon: FiUsers, color: '#ff4757' },
  ];

  // Build chart data from jobs by status
  const jobsByStatus = stats?.fine_tuning_jobs?.by_status || {};
  const jobsChartData = Object.entries(jobsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Build deployment chart data
  const deploysByEnv = stats?.deployments?.by_environment || {};
  const deploysChartData = Object.entries(deploysByEnv).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Recent activity from audit logs
  const recentActivity = (stats?.recent_activity || []).slice(0, 8);

  const tooltipStyle = {
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your AI fine-tuning platform</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-icon" style={{ color: card.color }}>
              <card.icon />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-title">Jobs by Status</div>
          {jobsChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={jobsChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {jobsChartData.map((entry, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {jobsChartData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a0a0b8' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No job data</div></div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Deployments by Environment</div>
          {deploysChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deploysChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" stroke="#6a6a80" fontSize={12} />
                <YAxis stroke="#6a6a80" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#6c63ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No deployment data</div></div>
          )}
        </div>
      </div>

      <div className="recent-activity">
        <div className="recent-activity-title">Recent Activity</div>
        {recentActivity.length > 0 ? recentActivity.map((item) => (
          <div className="activity-item" key={item.id}>
            <div className="activity-icon"><FiActivity /></div>
            <div className="activity-text">
              <div className="activity-text-main">{item.action} — {item.resource_type} #{item.resource_id}</div>
              <div className="activity-text-sub">{item.user_name || `User #${item.user_id}`} — {item.created_at ? new Date(item.created_at).toLocaleString() : ''}</div>
            </div>
          </div>
        )) : (
          <div className="empty-state"><div className="empty-state-text">No recent activity</div></div>
        )}
      </div>
    </div>
  );
}
