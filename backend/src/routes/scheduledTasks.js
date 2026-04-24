const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/scheduled-tasks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const task_type = req.query.task_type;

    let query = 'SELECT * FROM scheduled_tasks';
    let countQuery = 'SELECT COUNT(*) FROM scheduled_tasks';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
      countParams.push(status);
    }
    if (task_type) {
      conditions.push(`task_type = $${params.length + 1}`);
      params.push(task_type);
      countParams.push(task_type);
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
    console.error('List scheduled tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/scheduled-tasks/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scheduled_tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/scheduled-tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, task_type, schedule, config, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO scheduled_tasks (name, description, task_type, schedule, config, status, run_count, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
       RETURNING *`,
      [name, description || null, task_type || null, schedule || null, config ? JSON.stringify(config) : null, status || 'active', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/scheduled-tasks/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, task_type, schedule, config, status } = req.body;

    const result = await db.query(
      `UPDATE scheduled_tasks
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           task_type = COALESCE($3, task_type),
           schedule = COALESCE($4, schedule),
           config = COALESCE($5, config),
           status = COALESCE($6, status),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name || null, description || null, task_type || null, schedule || null, config ? JSON.stringify(config) : null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/scheduled-tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM scheduled_tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }
    res.json({ message: 'Scheduled task deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/scheduled-tasks/:id/toggle
router.put('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const current = await db.query('SELECT * FROM scheduled_tasks WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }

    const newStatus = current.rows[0].status === 'active' ? 'paused' : 'active';

    const result = await db.query(
      `UPDATE scheduled_tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/scheduled-tasks/:id/run
router.post('/:id/run', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE scheduled_tasks
       SET last_run_at = NOW(),
           run_count = run_count + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }

    res.json({ message: 'Task executed successfully', task: result.rows[0] });
  } catch (err) {
    console.error('Run scheduled task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
