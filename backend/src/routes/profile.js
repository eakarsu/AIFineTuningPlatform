const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// GET /api/profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.company, u.role, u.created_at, u.updated_at,
              up.theme, up.timezone, up.language, up.notifications_enabled,
              up.email_notifications, up.items_per_page, up.sidebar_collapsed, up.updated_at as preferences_updated_at
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, company } = req.body;

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           company = COALESCE($2, company),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, company, role, created_at, updated_at`,
      [name || null, company || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Return defaults if no preferences exist
      return res.json({
        user_id: req.user.id,
        theme: 'light',
        timezone: 'UTC',
        language: 'en',
        notifications_enabled: true,
        email_notifications: true,
        items_per_page: 20,
        sidebar_collapsed: false,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { theme, timezone, language, notifications_enabled, email_notifications, items_per_page, sidebar_collapsed } = req.body;

    // Upsert preferences
    const result = await db.query(
      `INSERT INTO user_preferences (user_id, theme, timezone, language, notifications_enabled, email_notifications, items_per_page, sidebar_collapsed, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         theme = COALESCE($2, user_preferences.theme),
         timezone = COALESCE($3, user_preferences.timezone),
         language = COALESCE($4, user_preferences.language),
         notifications_enabled = COALESCE($5, user_preferences.notifications_enabled),
         email_notifications = COALESCE($6, user_preferences.email_notifications),
         items_per_page = COALESCE($7, user_preferences.items_per_page),
         sidebar_collapsed = COALESCE($8, user_preferences.sidebar_collapsed),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, theme || null, timezone || null, language || null, notifications_enabled != null ? notifications_enabled : null, email_notifications != null ? email_notifications : null, items_per_page || null, sidebar_collapsed != null ? sidebar_collapsed : null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
