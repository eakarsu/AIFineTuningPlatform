// Custom Views: 4 endpoints powering Training Views feature set
// - GET  /api/custom-views/training-loss        -> per-epoch train_loss + val_loss
// - GET  /api/custom-views/hyperparam-grid      -> experiments (lr x batch_size -> val_loss)
// - POST /api/custom-views/dataset-upload       -> multer multi-step dataset upload (JSONL/CSV)
// - POST /api/custom-views/model-deploy         -> multi-step model deployment wizard
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'custom-views');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jsonl|csv|json)$/i.test(file.originalname || '');
    cb(ok ? null : new Error('Only .jsonl / .csv / .json accepted'), ok);
  },
});

// ----- helpers -----
function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildTrainingLoss(runId = 'run-current', epochs = 20) {
  const rand = seededRand(
    String(runId).split('').reduce((a, c) => a + c.charCodeAt(0), 7)
  );
  const start = 2.4 + rand() * 0.4;
  const out = [];
  for (let i = 1; i <= epochs; i++) {
    const decay = Math.exp(-i / (epochs * 0.55));
    const trainNoise = (rand() - 0.5) * 0.06;
    const valNoise = (rand() - 0.5) * 0.12;
    const train_loss = +(0.35 + start * decay + trainNoise).toFixed(4);
    const val_loss = +(0.45 + start * decay * 1.08 + valNoise).toFixed(4);
    out.push({
      epoch: i,
      train_loss: Math.max(0.1, train_loss),
      val_loss: Math.max(0.12, val_loss),
    });
  }
  return out;
}

function buildExperiments() {
  const lrs = [1e-5, 3e-5, 1e-4, 3e-4, 1e-3];
  const bs = [4, 8, 16, 32, 64];
  const rand = seededRand(42);
  const cells = [];
  for (const lr of lrs) {
    for (const b of bs) {
      // U-shaped: very low / very high lr punished; mid lr + mid batch best
      const lrPenalty = Math.abs(Math.log10(lr) - (-3.8));
      const bsPenalty = Math.abs(Math.log2(b) - 4) * 0.15;
      const noise = (rand() - 0.5) * 0.15;
      const val_loss = +(0.35 + lrPenalty * 0.35 + bsPenalty + noise).toFixed(4);
      cells.push({
        experiment_id: `exp_${lrs.indexOf(lr)}_${bs.indexOf(b)}`,
        learning_rate: lr,
        batch_size: b,
        epochs: 10,
        final_val_loss: Math.max(0.18, val_loss),
        status: 'completed',
      });
    }
  }
  return { learning_rates: lrs, batch_sizes: bs, experiments: cells };
}

// ----- VIZ 1: training loss -----
router.get('/training-loss', (req, res) => {
  const runId = req.query.run_id || 'run-current';
  const epochs = Math.min(50, Math.max(5, parseInt(req.query.epochs, 10) || 20));
  const series = buildTrainingLoss(runId, epochs);
  res.json({
    run_id: runId,
    epochs,
    model: 'llama-3-8b-finetune',
    started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    series,
  });
});

// ----- VIZ 2: hyperparam grid -----
router.get('/hyperparam-grid', (_req, res) => {
  const data = buildExperiments();
  const best = data.experiments.reduce(
    (a, b) => (b.final_val_loss < a.final_val_loss ? b : a),
    data.experiments[0]
  );
  res.json({ ...data, best });
});

// ----- NON-VIZ 1: dataset upload wizard -----
// Multi-step in one endpoint via ?step= upload|preview|validate|confirm
router.post('/dataset-upload', upload.single('file'), (req, res) => {
  const step = (req.query.step || req.body.step || 'upload').toLowerCase();
  try {
    if (step === 'upload') {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      return res.json({
        step: 'upload',
        ok: true,
        file: {
          name: req.file.originalname,
          stored_as: req.file.filename,
          size_bytes: req.file.size,
          mime: req.file.mimetype,
        },
        next: 'preview',
      });
    }
    if (step === 'preview') {
      const name = req.body.stored_as || req.body.file || '';
      const target = name ? path.join(UPLOAD_DIR, path.basename(name)) : null;
      let rows = [];
      if (target && fs.existsSync(target)) {
        const txt = fs.readFileSync(target, 'utf8').split(/\r?\n/).filter(Boolean).slice(0, 5);
        if (/\.csv$/i.test(target)) {
          const headers = (txt[0] || '').split(',');
          rows = txt.slice(1).map((line) => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => (obj[h.trim()] = vals[i]));
            return obj;
          });
        } else {
          rows = txt.map((l) => {
            try { return JSON.parse(l); } catch { return { raw: l }; }
          });
        }
      } else {
        rows = [
          { prompt: 'Translate to French: hello', completion: 'Bonjour' },
          { prompt: 'Summarize: quick brown fox...', completion: 'A fox jumps.' },
          { prompt: 'Classify sentiment: I love this!', completion: 'positive' },
        ];
      }
      return res.json({ step: 'preview', rows, row_count_estimated: rows.length * 100, next: 'validate' });
    }
    if (step === 'validate') {
      const required = ['prompt', 'completion'];
      const sample = req.body.sample || { prompt: 'x', completion: 'y' };
      const missing = required.filter((k) => !(k in (sample || {})));
      const ok = missing.length === 0;
      return res.json({
        step: 'validate',
        ok,
        required_fields: required,
        missing_fields: missing,
        warnings: ok ? [] : [`Schema missing: ${missing.join(', ')}`],
        next: ok ? 'confirm' : 'preview',
      });
    }
    if (step === 'confirm') {
      const dataset_name = req.body.dataset_name || `dataset_${Date.now()}`;
      return res.json({
        step: 'confirm',
        ok: true,
        dataset_id: `ds_${Math.random().toString(36).slice(2, 10)}`,
        dataset_name,
        registered_at: new Date().toISOString(),
        message: 'Dataset registered for fine-tuning.',
      });
    }
    return res.status(400).json({ error: `Unknown step: ${step}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ----- NON-VIZ 2: model deployment wizard -----
router.post('/model-deploy', express.json(), (req, res) => {
  const step = (req.query.step || req.body.step || 'select').toLowerCase();
  try {
    if (step === 'select' || step === 'checkpoints') {
      return res.json({
        step: 'select',
        checkpoints: [
          { id: 'ckpt_001', name: 'llama-3-8b-ft / epoch-20', val_loss: 0.42, created_at: '2026-05-10T12:00:00Z' },
          { id: 'ckpt_002', name: 'mistral-7b-ft / epoch-15', val_loss: 0.55, created_at: '2026-05-12T09:30:00Z' },
          { id: 'ckpt_003', name: 'qwen-2-7b-ft / epoch-25', val_loss: 0.38, created_at: '2026-05-15T18:45:00Z' },
        ],
        next: 'endpoint',
      });
    }
    if (step === 'endpoint') {
      return res.json({
        step: 'endpoint',
        options: [
          { type: 'rest', label: 'REST Endpoint (always-on)', cost_per_hour: 3.5 },
          { type: 'serverless', label: 'Serverless (per-request)', cost_per_1k: 0.012 },
        ],
        next: 'scaling',
      });
    }
    if (step === 'scaling') {
      const endpoint_type = req.body.endpoint_type || 'rest';
      return res.json({
        step: 'scaling',
        endpoint_type,
        defaults: endpoint_type === 'serverless'
          ? { min_instances: 0, max_instances: 50, concurrency: 8, timeout_s: 30 }
          : { min_instances: 1, max_instances: 4, gpu_type: 'A10G', autoscale_cpu_pct: 70 },
        next: 'review',
      });
    }
    if (step === 'review') {
      return res.json({
        step: 'review',
        plan: {
          checkpoint_id: req.body.checkpoint_id || 'ckpt_001',
          endpoint_type: req.body.endpoint_type || 'rest',
          scaling: req.body.scaling || { min_instances: 1, max_instances: 4 },
          region: req.body.region || 'us-east-1',
        },
        estimated_monthly_usd: 612.4,
        next: 'deploy',
      });
    }
    if (step === 'deploy') {
      return res.json({
        step: 'deploy',
        ok: true,
        deployment_id: `dep_${Math.random().toString(36).slice(2, 10)}`,
        endpoint_url: `https://api.aifinetuning.com/v1/${req.body.checkpoint_id || 'ckpt_001'}`,
        status: 'provisioning',
        deployed_at: new Date().toISOString(),
      });
    }
    return res.status(400).json({ error: `Unknown step: ${step}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
