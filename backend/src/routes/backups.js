const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/backups
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const backup_type = req.query.backup_type;
    const status = req.query.status;

    let query = 'SELECT * FROM backups';
    let countQuery = 'SELECT COUNT(*) FROM backups';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (backup_type) {
      conditions.push(`backup_type = $${params.length + 1}`);
      params.push(backup_type);
      countParams.push(backup_type);
    }
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
      countParams.push(status);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('List backups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/backups/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM backups WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get backup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/backups
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, backup_type, size_mb, file_path, tables_included } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO backups (name, description, backup_type, size_mb, status, file_path, tables_included, user_id)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       RETURNING *`,
      [name, description || null, backup_type || 'full', size_mb || 0, file_path || null, tables_included ? JSON.stringify(tables_included) : null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create backup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/backups/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, backup_type, size_mb, status, file_path, tables_included } = req.body;

    const result = await db.query(
      `UPDATE backups
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           backup_type = COALESCE($3, backup_type),
           size_mb = COALESCE($4, size_mb),
           status = COALESCE($5, status),
           file_path = COALESCE($6, file_path),
           tables_included = COALESCE($7, tables_included)
       WHERE id = $8
       RETURNING *`,
      [name || null, description || null, backup_type || null, size_mb || null, status || null, file_path || null, tables_included ? JSON.stringify(tables_included) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update backup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/backups/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM backups WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.json({ message: 'Backup deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete backup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/backups/:id/restore
router.post('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM backups WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const backup = result.rows[0];
    res.json({
      message: 'Restore initiated successfully',
      backup_id: backup.id,
      backup_name: backup.name,
      backup_type: backup.backup_type,
      tables_included: backup.tables_included,
      status: 'restoring',
    });
  } catch (err) {
    console.error('Restore backup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
