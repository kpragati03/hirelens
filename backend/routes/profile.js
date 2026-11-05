const express = require('express');
const Profile = require('../models/Profile');
const router = express.Router();

// GET /api/profile — the single candidate profile
router.get('/', async (req, res) => {
  const profile = await Profile.findOne().sort({ updatedAt: -1 });
  res.json({ ok: true, profile: profile || null });
});

// POST /api/profile — create or update (upsert by email, else the latest profile)
router.post('/', async (req, res) => {
  const { name, headline = '', email, location = '', skills = '', experienceYears = 0, summary = '', resumeText = '' } = req.body;
  if (!name || !email) return res.status(400).json({ ok: false, error: 'name and email are required' });
  const profile = await Profile.findOneAndUpdate(
    { email },
    { name, headline, email, location, skills, experienceYears, summary, resumeText },
    { new: true, upsert: true }
  );
  res.json({ ok: true, profile });
});

module.exports = router;
