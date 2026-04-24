const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/team-members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const team_name = req.query.team_name;
    const status = req.query.status;

    let query = `SELECT tm.*, u.name as user_name, u.email as user_email, inv.name as invited_by_name
                 FROM team_members tm
                 LEFT JOIN users u ON tm.user_id = u.id
                 LEFT JOIN users inv ON tm.invited_by = inv.id`;
    let countQuery = 'SELECT COUNT(*) FROM team_members tm';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (team_name) {
      conditions.push(`tm.team_name = $${params.length + 1}`);
      params.push(team_name);
      countParams.push(team_name);
    }
    if (status) {
      conditions.push(`tm.status = $${params.length + 1}`);
      params.push(status);
      countParams.push(status);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    query += ' ORDER BY tm.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
    console.error('List team members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/team-members/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.*, u.name as user_name, u.email as user_email
       FROM team_members tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get team member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/team-members
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, team_name, role } = req.body;

    if (!user_id || !team_name) {
      return res.status(400).json({ error: 'user_id and team_name are required' });
    }

    const result = await db.query(
      `INSERT INTO team_members (user_id, team_name, role, invited_by, status)
       VALUES ($1, $2, $3, $4, 'invited')
       RETURNING *`,
      [user_id, team_name, role || 'member', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create team member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/team-members/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { team_name, role, status } = req.body;

    const result = await db.query(
      `UPDATE team_members
       SET team_name = COALESCE($1, team_name),
           role = COALESCE($2, role),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [team_name || null, role || null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update team member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/team-members/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM team_members WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete team member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
