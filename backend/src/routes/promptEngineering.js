// Prompt engineering tools: A/B test prompts, measure performance, optimise.
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

// POST /api/prompt-engineering/eval { prompt_a, prompt_b, test_cases:[{input, expected}], judge_criteria? }
router.post('/eval', authMiddleware, async (req, res) => {
  try {
    const { prompt_a, prompt_b, test_cases = [], judge_criteria = 'accuracy and helpfulness' } = req.body || {};
    if (!prompt_a || !prompt_b || !test_cases.length) return res.status(400).json({ error: 'prompt_a, prompt_b, test_cases[] required' });

    let aWins = 0, bWins = 0, ties = 0;
    const details = [];
    for (const tc of test_cases.slice(0, 20)) {
      try {
        const aOut = await callOpenRouter([{ role: 'system', content: prompt_a }, { role: 'user', content: tc.input }]);
        const bOut = await callOpenRouter([{ role: 'system', content: prompt_b }, { role: 'user', content: tc.input }]);
        const judge = await callOpenRouter([
          { role: 'system', content: `Judge two responses by ${judge_criteria}. Output JSON {"winner":"a|b|tie","reason":"..."}.` },
          { role: 'user', content: JSON.stringify({ input: tc.input, expected: tc.expected, a: aOut, b: bOut }) },
        ]);
        let verdict;
        try { verdict = JSON.parse(judge.match(/\{[\s\S]*\}/)?.[0] || judge); } catch { verdict = { winner: 'tie' }; }
        if (verdict.winner === 'a') aWins++;
        else if (verdict.winner === 'b') bWins++;
        else ties++;
        details.push({ input: tc.input, verdict });
      } catch (e) {
        details.push({ input: tc.input, error: e.message });
      }
    }
    return res.json({ a_wins: aWins, b_wins: bWins, ties, details });
  } catch (e) {
    return res.status(500).json({ error: 'eval failed' });
  }
});

module.exports = router;
