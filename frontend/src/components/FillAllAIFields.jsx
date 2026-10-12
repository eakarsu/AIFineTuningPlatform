import React from 'react';
import './FormattedAIReport.css';

export default function FillAllAIFields({ examples, onFill, disabled = false, note = 'Each example fills every editable field, including optional settings. Review values before running.' }) {
  return (
    <section className="ai-preset-bar" aria-label="Fill all AI inputs">
      <div>
        <strong>Fill all AI fields</strong>
        <p>{note}</p>
      </div>
      <div className="ai-actions">
        {examples.map((example) => (
          <button key={example.label} type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onFill(example.values)}>
            {example.label}
          </button>
        ))}
      </div>
    </section>
  );
}
