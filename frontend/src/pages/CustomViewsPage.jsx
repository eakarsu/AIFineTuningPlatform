import React from 'react';
import TrainingLossChart from '../components/TrainingLossChart';
import HyperparamGrid from '../components/HyperparamGrid';
import DatasetUploadWizard from '../components/DatasetUploadWizard';
import ModelDeployWizard from '../components/ModelDeployWizard';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Training Views</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Custom dashboards and wizards for fine-tuning lifecycle: monitor losses,
        compare hyperparameters, upload datasets, deploy models.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <TrainingLossChart runId="run-current" epochs={20} />
        <HyperparamGrid />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <DatasetUploadWizard />
        <ModelDeployWizard />
      </div>
    </div>
  );
}
