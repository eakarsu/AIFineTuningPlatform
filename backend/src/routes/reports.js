const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/reports
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const report_type = req.query.report_type;
    const status = req.query.status;

    let query = 'SELECT * FROM reports';
    let countQuery = 'SELECT COUNT(*) FROM reports';
    const params = [];
    const countParams = [];
    const conditions = [];

    if (report_type) {
      conditions.push(`report_type = $${params.length + 1}`);
      params.push(report_type);
      countParams.push(report_type);
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
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reports
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, report_type, parameters, format } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      `INSERT INTO reports (name, description, report_type, parameters, format, status, user_id)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [name, description || null, report_type || null, parameters ? JSON.stringify(parameters) : null, format || 'json', req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reports/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, report_type, parameters, format, status } = req.body;

    const result = await db.query(
      `UPDATE reports
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           report_type = COALESCE($3, report_type),
           parameters = COALESCE($4, parameters),
           format = COALESCE($5, format),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [name || null, description || null, report_type || null, parameters ? JSON.stringify(parameters) : null, format || null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reports WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reports/:id/generate
router.post('/:id/generate', authMiddleware, async (req, res) => {
  try {
    const current = await db.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Set status to generating
    await db.query(
      `UPDATE reports SET status = 'generating' WHERE id = $1`,
      [req.params.id]
    );

    // Simulate generation with mock result data
    const mockResultData = {
      generated_at: new Date().toISOString(),
      summary: 'Report generated successfully',
      metrics: {
        total_records: Math.floor(Math.random() * 1000) + 100,
        avg_score: parseFloat((Math.random() * 100).toFixed(2)),
        completion_rate: parseFloat((Math.random() * 100).toFixed(1)),
      },
      charts: [
        { type: 'bar', title: 'Performance Over Time', data_points: 12 },
        { type: 'pie', title: 'Distribution by Category', data_points: 5 },
      ],
    };

    const result = await db.query(
      `UPDATE reports
       SET status = 'completed',
           result_data = $1,
           completed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(mockResultData), req.params.id]
    );

    res.json({ message: 'Report generated successfully', report: result.rows[0] });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
