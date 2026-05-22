import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STEPS = ['select', 'endpoint', 'scaling', 'review', 'deploy'];

export default function ModelDeployWizard() {
  const [stepIdx, setStepIdx] = useState(0);
  const [checkpoints, setCheckpoints] = useState([]);
  const [checkpointId, setCheckpointId] = useState('');
  const [endpointOpts, setEndpointOpts] = useState([]);
  const [endpointType, setEndpointType] = useState('rest');
  const [scaling, setScaling] = useState({});
  const [review, setReview] = useState(null);
  const [deployed, setDeployed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    // Step 1: load checkpoints
    api.post('/custom-views/model-deploy?step=select', {})
      .then((r) => {
        setCheckpoints(r.data.checkpoints || []);
        if ((r.data.checkpoints || [])[0]) setCheckpointId(r.data.checkpoints[0].id);
      })
      .catch((e) => setErr(e?.response?.data?.error || e.message));
  }, []);

  async function gotoEndpoint() {
    setBusy(true); setErr('');
    try {
      const r = await api.post('/custom-views/model-deploy?step=endpoint', { checkpoint_id: checkpointId });
      setEndpointOpts(r.data.options || []);
      setStepIdx(1);
    } catch (e) { setErr(e?.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  async function gotoScaling() {
    setBusy(true); setErr('');
    try {
      const r = await api.post('/custom-views/model-deploy?step=scaling', { endpoint_type: endpointType });
      setScaling(r.data.defaults || {});
      setStepIdx(2);
    } catch (e) { setErr(e?.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  async function gotoReview() {
    setBusy(true); setErr('');
    try {
      const r = await api.post('/custom-views/model-deploy?step=review', {
        checkpoint_id: checkpointId,
        endpoint_type: endpointType,
        scaling,
      });
      setReview(r.data);
      setStepIdx(3);
    } catch (e) { setErr(e?.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  async function doDeploy() {
    setBusy(true); setErr('');
    try {
      const r = await api.post('/custom-views/model-deploy?step=deploy', {
        checkpoint_id: checkpointId,
        endpoint_type: endpointType,
        scaling,
      });
      setDeployed(r.data);
      setStepIdx(4);
    } catch (e) { setErr(e?.response?.data?.error || e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 4 }}>Model Deployment Wizard</h3>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        checkpoint &rarr; endpoint &rarr; scaling &rarr; review &rarr; deploy
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 4, textAlign: 'center',
              background: i <= stepIdx ? '#00d4aa' : '#e5e7eb',
              color: i <= stepIdx ? '#fff' : '#374151',
              fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {err && <div style={{ color: '#ef4444', marginBottom: 12 }}>Error: {err}</div>}

      {stepIdx === 0 && (
        <div>
          <label style={lbl}>Choose checkpoint:</label>
          <select value={checkpointId} onChange={(e) => setCheckpointId(e.target.value)} style={inp}>
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (val_loss={c.val_loss})</option>
            ))}
          </select>
          <button disabled={busy || !checkpointId} onClick={gotoEndpoint} style={btn}>Next: endpoint</button>
        </div>
      )}

      {stepIdx === 1 && (
        <div>
          <label style={lbl}>Endpoint type:</label>
          <div style={{ marginBottom: 12 }}>
            {endpointOpts.map((o) => (
              <label key={o.type} style={{ display: 'block', padding: 6 }}>
                <input
                  type="radio" name="ep" value={o.type}
                  checked={endpointType === o.type}
                  onChange={() => setEndpointType(o.type)}
                />{' '}
                <strong>{o.label}</strong>
              </label>
            ))}
          </div>
          <button disabled={busy} onClick={gotoScaling} style={btn}>Next: scaling</button>
        </div>
      )}

      {stepIdx === 2 && (
        <div>
          <label style={lbl}>Scaling parameters:</label>
          <pre style={preStyle}>{JSON.stringify(scaling, null, 2)}</pre>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {Object.keys(scaling).map((k) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{k}</div>
                <input
                  value={scaling[k]}
                  onChange={(e) => setScaling((p) => ({ ...p, [k]: e.target.value }))}
                  style={{ ...inp, width: 100 }}
                />
              </div>
            ))}
          </div>
          <button disabled={busy} onClick={gotoReview} style={btn}>Next: review</button>
        </div>
      )}

      {stepIdx === 3 && (
        <div>
          <label style={lbl}>Review plan:</label>
          <pre style={preStyle}>{JSON.stringify(review?.plan, null, 2)}</pre>
          <div style={{ marginBottom: 12 }}>Estimated monthly: <strong>${review?.estimated_monthly_usd}</strong></div>
          <button disabled={busy} onClick={doDeploy} style={{ ...btn, background: '#00d4aa' }}>Deploy now</button>
        </div>
      )}

      {stepIdx === 4 && deployed && (
        <div style={{ padding: 12, background: '#ecfdf5', border: '1px solid #16a34a', borderRadius: 4 }}>
          <div>Deployed: <code>{deployed.deployment_id}</code></div>
          <div>Endpoint: <code>{deployed.endpoint_url}</code></div>
          <div>Status: <strong>{deployed.status}</strong></div>
        </div>
      )}
    </div>
  );
}

const btn = {
  background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 4,
  padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
};
const inp = {
  display: 'block', padding: 8, marginBottom: 12, width: '100%',
  border: '1px solid #d1d5db', borderRadius: 4,
};
const lbl = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };
const preStyle = {
  background: '#f3f4f6', padding: 10, borderRadius: 4, fontSize: 12,
  maxHeight: 200, overflow: 'auto',
};
