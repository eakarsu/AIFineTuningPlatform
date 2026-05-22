import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

export default function TrainingLossChart({ runId = 'run-current', epochs = 20 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/custom-views/training-loss?run_id=${encodeURIComponent(runId)}&epochs=${epochs}`)
      .then((r) => { if (alive) { setData(r.data); setErr(''); } })
      .catch((e) => { if (alive) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [runId, epochs]);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 4 }}>Training Loss Chart</h3>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
        train_loss vs val_loss per epoch &mdash; run <code>{runId}</code>
      </div>
      {loading && <div style={{ padding: 24 }}>Loading...</div>}
      {err && <div style={{ color: '#ef4444' }}>Error: {err}</div>}
      {data?.series && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -2 }} />
            <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="train_loss" stroke="#6c63ff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="val_loss" stroke="#ff4757" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
