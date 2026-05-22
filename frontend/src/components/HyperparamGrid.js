import React, { useEffect, useState } from 'react';
import api from '../services/api';

function lossToColor(v, min, max) {
  if (max === min) return 'rgb(110, 200, 110)';
  const t = Math.min(1, Math.max(0, (v - min) / (max - min)));
  // green (low loss) -> red (high loss)
  const r = Math.round(80 + t * 160);
  const g = Math.round(190 - t * 140);
  const b = 90;
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HyperparamGrid() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/custom-views/hyperparam-grid')
      .then((r) => { if (alive) { setData(r.data); setErr(''); } })
      .catch((e) => { if (alive) setErr(e?.response?.data?.error || e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err) return <div style={{ color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const { learning_rates, batch_sizes, experiments, best } = data;
  const losses = experiments.map((e) => e.final_val_loss);
  const lo = Math.min(...losses);
  const hi = Math.max(...losses);
  const lookup = {};
  experiments.forEach((e) => { lookup[`${e.learning_rate}_${e.batch_size}`] = e; });

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 4 }}>Hyperparameter Grid</h3>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
        learning_rate &times; batch_size, cells colored by final val_loss (green=low, red=high)
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(${batch_sizes.length}, 1fr)`,
          gap: 4,
          fontSize: 12,
        }}
      >
        <div></div>
        {batch_sizes.map((b) => (
          <div key={`h_${b}`} style={{ textAlign: 'center', fontWeight: 600, padding: 6 }}>
            bs={b}
          </div>
        ))}
        {learning_rates.map((lr) => (
          <React.Fragment key={`row_${lr}`}>
            <div style={{ fontWeight: 600, padding: 6, textAlign: 'right' }}>lr={lr}</div>
            {batch_sizes.map((b) => {
              const exp = lookup[`${lr}_${b}`];
              const bg = lossToColor(exp.final_val_loss, lo, hi);
              const isBest = best && exp.experiment_id === best.experiment_id;
              return (
                <div
                  key={`c_${lr}_${b}`}
                  title={`lr=${lr}, bs=${b}\nval_loss=${exp.final_val_loss}`}
                  style={{
                    background: bg,
                    color: '#fff',
                    padding: '14px 8px',
                    textAlign: 'center',
                    borderRadius: 4,
                    fontWeight: 600,
                    outline: isBest ? '2px solid #111827' : 'none',
                  }}
                >
                  {exp.final_val_loss.toFixed(3)}
                  {isBest && <div style={{ fontSize: 10, fontWeight: 400 }}>BEST</div>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {best && (
        <div style={{ marginTop: 16, padding: 12, background: '#f3f4f6', borderRadius: 6, fontSize: 13 }}>
          <strong>Best experiment:</strong> lr={best.learning_rate}, bs={best.batch_size}, val_loss={best.final_val_loss}
        </div>
      )}
    </div>
  );
}
