'use strict';
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32 || /change|replace|example|default/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a unique value of at least 32 characters');
}
const ROLES = Object.freeze(['viewer', 'user', 'admin']);

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Bearer authorization is required' });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    if (!decoded.id || !decoded.tenant_id || !ROLES.includes(decoded.role)) return res.status(401).json({ error: 'Token is missing required identity claims' });
    req.user = decoded;
    return next();
  } catch (_) { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
function signToken(user) {
  if (!user.id || !user.tenant_id || !ROLES.includes(user.role)) throw new Error('Cannot sign incomplete identity');
  return jwt.sign({ id: user.id, tenant_id: user.tenant_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.signToken = signToken;
module.exports.JWT_SECRET = JWT_SECRET;
module.exports.ROLES = ROLES;
