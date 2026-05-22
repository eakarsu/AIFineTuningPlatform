import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './services/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FineTuningJobsPage from './pages/FineTuningJobsPage';
import DatasetsPage from './pages/DatasetsPage';
import BaseModelsPage from './pages/BaseModelsPage';
import CustomModelsPage from './pages/CustomModelsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import DeploymentsPage from './pages/DeploymentsPage';
import TrainingConfigsPage from './pages/TrainingConfigsPage';
import DataPipelinesPage from './pages/DataPipelinesPage';
import ModelComparisonsPage from './pages/ModelComparisonsPage';
import PromptTemplatesPage from './pages/PromptTemplatesPage';
import UsageBillingPage from './pages/UsageBillingPage';
import AuditLogsPage from './pages/AuditLogsPage';
import TeamMembersPage from './pages/TeamMembersPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import WebhooksPage from './pages/WebhooksPage';
import TagsPage from './pages/TagsPage';
import FavoritesPage from './pages/FavoritesPage';
import CommentsPage from './pages/CommentsPage';
import ScheduledTasksPage from './pages/ScheduledTasksPage';
import ReportsPage from './pages/ReportsPage';
import FilesPage from './pages/FilesPage';
import BackupsPage from './pages/BackupsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import ActivityPage from './pages/ActivityPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ExportPage from './pages/ExportPage';
import AiResultsPage from './pages/AiResultsPage';
import InferencePage from './pages/InferencePage';
import CostEstimatorPage from './pages/CostEstimatorPage';
import BayesianSearchPage from './pages/BayesianSearchPage';
import PromptABTesterPage from './pages/PromptABTesterPage';
import MarketplacePage from './pages/MarketplacePage';
import DeploymentTemplatesPage from './pages/DeploymentTemplatesPage';
import HuggingFacePage from './pages/HuggingFacePage';

import Batch03Features from './pages/Batch03Features';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import DatasetLeakageGuardPage from './pages/DatasetLeakageGuardPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

          <Route path="/batch03" element={<Batch03Features />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/fine-tuning-jobs" element={<FineTuningJobsPage />} />
                <Route path="/datasets" element={<DatasetsPage />} />
                <Route path="/base-models" element={<BaseModelsPage />} />
                <Route path="/custom-models" element={<CustomModelsPage />} />
                <Route path="/evaluations" element={<EvaluationsPage />} />
                <Route path="/api-keys" element={<ApiKeysPage />} />
                <Route path="/deployments" element={<DeploymentsPage />} />
                <Route path="/training-configs" element={<TrainingConfigsPage />} />
                <Route path="/data-pipelines" element={<DataPipelinesPage />} />
                <Route path="/model-comparisons" element={<ModelComparisonsPage />} />
                <Route path="/prompt-templates" element={<PromptTemplatesPage />} />
                <Route path="/usage-billing" element={<UsageBillingPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/team-members" element={<TeamMembersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/tags" element={<TagsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/comments" element={<CommentsPage />} />
                <Route path="/scheduled-tasks" element={<ScheduledTasksPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/backups" element={<BackupsPage />} />
                <Route path="/admin-settings" element={<AdminSettingsPage />} />
                <Route path="/search" element={<GlobalSearchPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/ai-results" element={<AiResultsPage />} />
                <Route path="/inference" element={<InferencePage />} />
                <Route path="/cost-estimator" element={<CostEstimatorPage />} />
                <Route path="/bayesian-search" element={<BayesianSearchPage />} />
                <Route path="/prompt-ab" element={<PromptABTesterPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/deployment-templates" element={<DeploymentTemplatesPage />} />
                <Route path="/huggingface" element={<HuggingFacePage />} />
                <Route path="/custom-views" element={<CustomViewsPage />} />
                <Route path="/dataset-leakage" element={<DatasetLeakageGuardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#ffffff',
            border: '1px solid #2a2a3e',
            borderRadius: '8px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#00d4aa', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ff4757', secondary: '#ffffff' },
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}
