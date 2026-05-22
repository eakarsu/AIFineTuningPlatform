import React, { useState } from 'react';
import api from '../services/api';

const STEPS = ['upload', 'preview', 'validate', 'confirm'];

export default function DatasetUploadWizard() {
  const [stepIdx, setStepIdx] = useState(0);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [previewRows, setPreviewRows] = useState(null);
  const [validation, setValidation] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const step = STEPS[stepIdx];

  async function doUpload() {
    if (!file) { setErr('Choose a file first'); return; }
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/custom-views/dataset-upload?step=upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploaded(res.data);
      setStepIdx(1);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally { setBusy(false); }
  }

  async function doPreview() {
    setBusy(true); setErr('');
    try {
      const res = await api.post('/custom-views/dataset-upload?step=preview', {
        stored_as: uploaded?.file?.stored_as,
      });
      setPreviewRows(res.data.rows);
      setStepIdx(2);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally { setBusy(false); }
  }

  async function doValidate() {
    setBusy(true); setErr('');
    try {
      const res = await api.post('/custom-views/dataset-upload?step=validate', {
        sample: (previewRows && previewRows[0]) || {},
      });
      setValidation(res.data);
      setStepIdx(3);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally { setBusy(false); }
  }

  async function doConfirm() {
    setBusy(true); setErr('');
    try {
      const res = await api.post('/custom-views/dataset-upload?step=confirm', {
        dataset_name: datasetName || (uploaded?.file?.name || 'dataset'),
      });
      setConfirmed(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally { setBusy(false); }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: 0, marginBottom: 4 }}>Dataset Upload Wizard</h3>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        Multi-step: upload &rarr; preview &rarr; validate &rarr; confirm
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 4, textAlign: 'center',
              background: i <= stepIdx ? '#6c63ff' : '#e5e7eb',
              color: i <= stepIdx ? '#fff' : '#374151',
              fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {err && <div style={{ color: '#ef4444', marginBottom: 12 }}>Error: {err}</div>}

      {step === 'upload' && (
        <div>
          <input
            type="file" accept=".jsonl,.csv,.json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: 'block', marginBottom: 12 }}
          />
          <button disabled={busy || !file} onClick={doUpload} style={btn}>Upload</button>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Uploaded: <code>{uploaded?.file?.name}</code> ({uploaded?.file?.size_bytes} bytes)
          </div>
          <button disabled={busy} onClick={doPreview} style={btn}>Load preview</button>
        </div>
      )}

      {step === 'validate' && (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>First {previewRows?.length} rows:</div>
          <pre style={preStyle}>{JSON.stringify(previewRows, null, 2)}</pre>
          <button disabled={busy} onClick={doValidate} style={btn}>Validate schema</button>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Validation: {validation?.ok ? <span style={{ color: '#16a34a' }}>OK</span> : <span style={{ color: '#ef4444' }}>missing {validation?.missing_fields?.join(', ')}</span>}
          </div>
          <input
            type="text" placeholder="Dataset name"
            value={datasetName} onChange={(e) => setDatasetName(e.target.value)}
            style={{ display: 'block', padding: 8, marginBottom: 12, width: '100%', border: '1px solid #d1d5db', borderRadius: 4 }}
          />
          <button disabled={busy} onClick={doConfirm} style={btn}>Confirm & register</button>
          {confirmed && (
            <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', border: '1px solid #16a34a', borderRadius: 4 }}>
              Registered: <code>{confirmed.dataset_id}</code> ({confirmed.dataset_name})
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btn = {
  background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 4,
  padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
};
const preStyle = {
  background: '#f3f4f6', padding: 10, borderRadius: 4, fontSize: 12,
  maxHeight: 200, overflow: 'auto',
};
