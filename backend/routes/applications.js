const express = require('express');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const { STAGES } = require('../models/Application');
const { matchResume } = require('../utils/ai');
const router = express.Router();

// GET /api/applications
router.get('/', async (req, res) => {
  const applications = await Application.find().sort({ createdAt: -1 });
  res.json({ ok: true, applications });
});

// POST /api/applications { jobId, candidateName?, candidateEmail?, skills?, resumeText? }
// Runs the AI match and creates the application in the Applied stage.
router.post('/', async (req, res) => {
  const { jobId, candidateName, candidateEmail, skills, resumeText } = req.body;
  if (!jobId) return res.status(400).json({ ok: false, error: 'jobId is required' });
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
  const saved = await Profile.findOne().sort({ updatedAt: -1 });
  const name = candidateName || saved?.name;
  const email = candidateEmail || saved?.email;
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Save a candidate profile first (name and email are required)' });
  const profile = { skills: skills ?? saved?.skills ?? '', resumeText: resumeText ?? saved?.resumeText ?? '' };
  const match = await matchResume(job, profile);
  const existing = await Application.findOne({ jobId: job._id, candidateEmail: email });
  if (existing) return res.status(409).json({ ok: false, error: 'Already applied to this job', application: existing });
  const application = await Application.create({
    jobId: job._id,
    jobTitle: job.title,
    company: job.company,
    candidateName: name,
    candidateEmail: email,
    skills: profile.skills,
    matchScore: match.score,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    aiSummary: `${match.verdict} ${match.strengths.join(' ')}`,
    stage: 'Applied',
  });
  res.status(201).json({ ok: true, application });
});

// PATCH /api/applications/:id/stage { stage }
router.patch('/:id/stage', async (req, res) => {
  const { stage } = req.body;
  if (!STAGES.includes(stage)) return res.status(400).json({ ok: false, error: `stage must be one of: ${STAGES.join(', ')}` });
  const application = await Application.findByIdAndUpdate(req.params.id, { stage }, { new: true });
  if (!application) return res.status(404).json({ ok: false, error: 'Application not found' });
  res.json({ ok: true, application });
});

router.delete('/:id', async (req, res) => {
  await Application.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
