const express = require('express');
const router = express.Router();

router.post('/scan', (req, res) => {
  const examples = Array.isArray(req.body?.examples) ? req.body.examples : [
    { id: 'row_1', text: 'Customer email alex@example.com asks for refund. Expected answer: issue refund.' },
    { id: 'row_2', text: 'Public docs question about billing API.' }
  ];
  const rows = examples.map((example) => {
    const text = String(example.text || '');
    const hits = [
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) && 'email',
      /\b\d{3}-\d{2}-\d{4}\b/.test(text) && 'ssn',
      /expected answer|ground truth|label:/i.test(text) && 'label_leakage',
      /api[_-]?key|secret|token/i.test(text) && 'secret',
    ].filter(Boolean);
    return { id: example.id || 'example', risk: hits.length ? 'review' : 'clear', hits };
  });
  res.json({
    riskyRows: rows.filter((row) => row.hits.length).length,
    rows,
    action: rows.some((row) => row.hits.length) ? 'Quarantine risky examples and regenerate training splits.' : 'Dataset can proceed to fine-tuning checks.',
  });
});

module.exports = router;
