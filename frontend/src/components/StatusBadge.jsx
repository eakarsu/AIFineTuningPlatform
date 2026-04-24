import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const knownStatuses = [
    'completed', 'active', 'success', 'deployed', 'healthy',
    'running', 'training', 'in_progress', 'processing',
    'pending', 'queued', 'draft', 'inactive',
    'failed', 'error', 'revoked', 'cancelled'
  ];

  const badgeClass = knownStatuses.includes(normalized)
    ? `badge badge-${normalized}`
    : 'badge badge-default';

  return (
    <span className={badgeClass}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
