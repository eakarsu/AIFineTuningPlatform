import React from 'react';
import { FiX } from 'react-icons/fi';
import FormattedAIReport from './FormattedAIReport';

export default function AIOutput({ response, loading, onClose }) {
  if (loading) {
    return (
      <section className="ai-output" role="status" aria-live="polite">
        <div className="ai-output-inner">
          <div className="ai-loading">
            <div className="ai-loading-dots"><span className="ai-loading-dot" /><span className="ai-loading-dot" /><span className="ai-loading-dot" /></div>
            <div className="ai-loading-text">AI is preparing a structured report…</div>
          </div>
        </div>
      </section>
    );
  }

  if (!response) return null;

  return (
    <section className="ai-output">
      {onClose && <button type="button" className="ai-output-close" aria-label="Close AI report" onClick={onClose}><FiX /></button>}
      <FormattedAIReport response={response} title="AI analysis" />
    </section>
  );
}
