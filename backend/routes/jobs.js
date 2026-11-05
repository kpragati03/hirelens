const express = require('express');
const Job = require('../models/Job');
const router = express.Router();

// GET /api/jobs?search=&skill=
router.get('/', async (req, res) => {
  const { search = '', skill = '' } = req.query;
  const filter = {};
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ title: re }, { company: re }, { location: re }, { description: re }];
  }
  if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  res.json({ ok: true, jobs });
});

router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
  res.json({ ok: true, job });
});

// POST /api/jobs
router.post('/', async (req, res) => {
  const { title, company, location, jobType, level, salary = '', skills = [], description } = req.body;
  if (!title || !company || !location || !jobType || !level || !description) {
    return res.status(400).json({ ok: false, error: 'title, company, location, jobType, level and description are required' });
  }
  const skillsArr = Array.isArray(skills) ? skills : String(skills).split(',').map((s) => s.trim()).filter(Boolean);
  const job = await Job.create({ title, company, location, jobType, level, salary, skills: skillsArr, description });
  res.status(201).json({ ok: true, job });
});

router.delete('/:id', async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
