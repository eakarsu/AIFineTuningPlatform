'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const auth = require('../middleware/auth');
const { signToken } = require('../middleware/auth');

const router = express.Router();
router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = await db.query('SELECT id,email,password_hash,name,role,company,tenant_id FROM users WHERE lower(email)=$1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || !user.tenant_id || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, tenant_id: user.tenant_id, email: user.email, name: user.name, role: user.role, company: user.company } });
  } catch (error) { console.error('Login backend failed:', error.message); return res.status(503).json({ error: 'Authentication service unavailable' }); }
});
router.post('/register', (req, res) => res.status(404).json({ error: 'Self-registration is disabled; use the explicit bootstrap-admin command' }));
router.get('/me', auth, async (req, res) => {
  try { const result = await db.query('SELECT id,tenant_id,email,name,role,company,created_at,updated_at FROM users WHERE id=$1 AND tenant_id=$2', [req.user.id, req.user.tenant_id]); if (!result.rows[0]) return res.status(404).json({ error: 'User not found' }); return res.json(result.rows[0]); }
  catch (_) { return res.status(500).json({ error: 'Unable to load user' }); }
});
module.exports = router;
