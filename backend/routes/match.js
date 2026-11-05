const express = require('express');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const { matchResume } = require('../utils/ai');
const router = express.Router();

// POST /api/match { jobId, skills?, resumeText? }
// Does not save anything — use POST /api/applications to apply.
router.post('/', async (req, res) => {
  const { jobId, skills, resumeText } = req.body;
  if (!jobId) return res.status(400).json({ ok: false, error: 'jobId is required' });
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
  const saved = await Profile.findOne().sort({ updatedAt: -1 });
  const profile = {
    skills: skills ?? saved?.skills ?? '',
    resumeText: resumeText ?? saved?.resumeText ?? '',
  };
  const result = await matchResume(job, profile);
  res.json({ ok: true, jobId: job._id, jobTitle: job.title, company: job.company, ...result });
});

module.exports = router;
