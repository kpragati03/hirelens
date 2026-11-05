const express = require('express');
const Submission = require('../models/Submission');
const { reviewCode } = require('../utils/ai');
const router = express.Router();

// GET /api/assessments — all submissions (most recent first)
router.get('/', async (req, res) => {
  const submissions = await Submission.find().sort({ createdAt: -1 });
  res.json({ ok: true, submissions });
});

// POST /api/assessments/submit
// { challengeId, challengeTitle, code, passed, total, candidateName, candidateEmail }
router.post('/submit', async (req, res) => {
  const { challengeId, challengeTitle, code = '', passed = 0, total = 0, candidateName = '', candidateEmail = '' } = req.body;
  if (!challengeId || !challengeTitle) return res.status(400).json({ ok: false, error: 'challengeId and challengeTitle are required' });
  const review = await reviewCode({ code, challengeTitle, passed, total });
  const submission = await Submission.create({
    challengeId, challengeTitle, candidateName, candidateEmail, code,
    passed, total,
    correctness: review.correctness,
    efficiency: review.efficiency,
    readability: review.readability,
    feedback: review.feedback,
  });
  res.status(201).json({ ok: true, submission });
});

module.exports = router;
