const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  headline: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  location: { type: String, default: '' },
  skills: { type: String, default: '' }, // comma-separated, kept as a string to match the UI
  experienceYears: { type: Number, default: 0 },
  summary: { type: String, default: '' },
  resumeText: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
