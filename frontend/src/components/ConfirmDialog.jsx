import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <FiAlertTriangle />
            </div>
            <div className="confirm-dialog-title">{title || 'Confirm Delete'}</div>
            <div className="confirm-dialog-message">
              {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
            </div>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={onConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
