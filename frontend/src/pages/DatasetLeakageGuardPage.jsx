import React, { useState } from 'react';
import api from '../services/api';

const starter = JSON.stringify({ examples: [
  { id: 'row_1', text: 'Customer email alex@example.com asks for refund. Expected answer: issue refund.' },
  { id: 'row_2', text: 'Public docs question about billing API.' }
] }, null, 2);

export default function DatasetLeakageGuardPage() {
  const [payload, setPayload] = useState(starter);
  const [result, setResult] = useState(null);
  const run = async () => setResult((await api.post('/dataset-leakage/scan', JSON.parse(payload))).data);
  return (
    <div className="page">
      <h1>Dataset Leakage Guard</h1>
      <p>Detect PII, secrets, and answer leakage before launching fine-tuning jobs.</p>
      <textarea style={{ width: '100%', minHeight: 240 }} value={payload} onChange={(event) => setPayload(event.target.value)} />
      <button className="btn btn-primary" onClick={run} style={{ marginTop: 12 }}>Scan Dataset</button>
      {result && <div className="card" style={{ marginTop: 16 }}><h2>{result.riskyRows} risky rows</h2><p>{result.action}</p>{result.rows.map((row) => <p key={row.id}>{row.id}: {row.risk} {row.hits.join(', ')}</p>)}</div>}
    </div>
  );
}
