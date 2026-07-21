const crypto = require('crypto');
const db = require('../db');

/**
 * X-API-Key header authentication.
 *
 * Closes audit gap #6: api_keys table previously CRUD-only with no
 * actual auth path.
 *
 * Requests can either send a JWT bearer (handled by authMiddleware) OR an
 * X-API-Key header. This middleware can be chained behind authMiddleware
 * via `try-then-fallback` style with apiKeyOrJwt.
 */

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'X-API-Key header required' });
  }
  try {
    const keyHash = hashKey(apiKey);
    const result = await db.query(
      `SELECT ak.id, ak.user_id, ak.name, ak.scopes, ak.expires_at, u.email, u.role, u.tenant_id
         FROM api_keys ak
         LEFT JOIN users u ON u.id = ak.user_id
         WHERE ak.key_hash = $1 AND (ak.is_active IS NULL OR ak.is_active = TRUE)`,
      [keyHash]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    const row = result.rows[0];
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }
    // Update last_used_at best-effort
    db.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.id]).catch(() => {});

    if (!row.tenant_id) return res.status(401).json({ error: 'API key owner has no tenant assignment' });
    req.user = { id: row.user_id, tenant_id: row.tenant_id, email: row.email, role: row.role };
    req.apiKey = { id: row.id, name: row.name, scopes: row.scopes };
    next();
  } catch (e) {
    console.error('apiKeyAuth error:', e);
    res.status(500).json({ error: 'API key validation failed' });
  }
}

// Try JWT first, fall back to API key. Useful for inference endpoints.
function apiKeyOrJwt(jwtMiddleware) {
  return async function (req, res, next) {
    if (req.headers['x-api-key']) {
      return apiKeyAuth(req, res, next);
    }
    return jwtMiddleware(req, res, next);
  };
}

module.exports = { apiKeyAuth, apiKeyOrJwt, hashKey };
