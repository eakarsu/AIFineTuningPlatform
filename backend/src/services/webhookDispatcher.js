/**
 * Webhook dispatcher.
 *
 * Closes audit gap #7: webhooks table previously had no dispatcher.
 *
 * Listens for fine-tuning job status transitions by polling
 * `fine_tuning_jobs.updated_at` changes. Sends HMAC-signed POSTs to
 * subscribed webhook URLs filtered by `event_types` (JSONB array).
 */

const crypto = require('crypto');
const axios = require('axios');
const db = require('../db');

const POLL_INTERVAL_MS = parseInt(process.env.WEBHOOK_POLL_MS || '20000', 10);
let timer = null;
let lastSeenAt = new Date(Date.now() - 60_000); // start 1min back

async function ensureDeliveryTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id SERIAL PRIMARY KEY,
      webhook_id INTEGER,
      event_type VARCHAR(80),
      payload JSONB,
      response_status INTEGER,
      response_body TEXT,
      attempted_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function dispatchWebhook(webhook, event) {
  try {
    const body = JSON.stringify({ event_type: event.type, data: event.data, ts: Date.now() });
    const headers = { 'Content-Type': 'application/json' };
    if (webhook.secret) {
      headers['X-Signature-SHA256'] = sign(body, webhook.secret);
    }
    const response = await axios.post(webhook.url, body, { headers, timeout: 10_000 });
    await db.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_status, response_body)
       VALUES ($1,$2,$3,$4,$5)`,
      [webhook.id, event.type, body, response.status, JSON.stringify(response.data).slice(0, 1000)]
    );
  } catch (e) {
    await db.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_status, response_body)
       VALUES ($1,$2,$3,$4,$5)`,
      [webhook.id, event.type, JSON.stringify(event), null, e.message.slice(0, 500)]
    );
  }
}

async function tick() {
  try {
    await ensureDeliveryTable();
    // Look for jobs whose updated_at is newer than lastSeenAt and matches a status change.
    const since = lastSeenAt;
    const newSince = new Date();
    const jobs = await db.query(
      `SELECT id, user_id, name, status, updated_at FROM fine_tuning_jobs
        WHERE updated_at > $1 AND updated_at <= $2
          AND status IN ('queued','running','completed','failed')`,
      [since, newSince]
    );
    if (jobs.rows.length === 0) {
      lastSeenAt = newSince;
      return;
    }

    let webhooks = [];
    try {
      const r = await db.query('SELECT * FROM webhooks WHERE is_active IS NOT FALSE');
      webhooks = r.rows;
    } catch (_) {
      lastSeenAt = newSince;
      return;
    }

    for (const job of jobs.rows) {
      const eventType = `fine_tuning_job.${job.status}`;
      for (const wh of webhooks) {
        const types = Array.isArray(wh.event_types) ? wh.event_types : (wh.events || []);
        const subscribesAll = !types || types.length === 0;
        if (subscribesAll || types.includes(eventType) || types.includes('fine_tuning_job.*')) {
          dispatchWebhook(wh, { type: eventType, data: job }).catch(() => {});
        }
      }
    }
    lastSeenAt = newSince;
  } catch (e) {
    console.error('[webhookDispatcher] tick error', e);
  }
}

function startWebhookDispatcher() {
  if (timer) return;
  if (process.env.WEBHOOKS_DISABLED === 'true') return;
  setTimeout(tick, 7000);
  timer = setInterval(tick, POLL_INTERVAL_MS);
  console.log(`[webhookDispatcher] started (poll=${POLL_INTERVAL_MS / 1000}s)`);
}

module.exports = { startWebhookDispatcher, dispatchWebhook };
