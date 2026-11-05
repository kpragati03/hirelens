const express = require('express');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const router = express.Router();

// GET /api/interviews
router.get('/', async (req, res) => {
  const interviews = await Interview.find().sort({ date: 1, time: 1 });
  res.json({ ok: true, interviews });
});

// POST /api/interviews { applicationId?, candidateName, jobTitle?, company?, date, time, mode?, notes? }
// If applicationId is given, that application moves to the Interview stage.
router.post('/', async (req, res) => {
  const { applicationId, candidateName, jobTitle = '', company = '', date, time, mode = 'Video', notes = '' } = req.body;
  if (!candidateName || !date || !time) return res.status(400).json({ ok: false, error: 'candidateName, date and time are required' });
  const interview = await Interview.create({ applicationId: applicationId || undefined, candidateName, jobTitle, company, date, time, mode, notes });
  if (applicationId) {
    await Application.findByIdAndUpdate(applicationId, { stage: 'Interview' });
  }
  res.status(201).json({ ok: true, interview });
});

router.delete('/:id', async (req, res) => {
  await Interview.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
