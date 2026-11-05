const mongoose = require('mongoose');

const STAGES = ['Applied', 'Shortlisted', 'Assessment', 'Interview', 'Offer', 'Rejected'];

const ApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  skills: { type: String, default: '' },
  matchScore: { type: Number, default: 0 },
  matchedSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  aiSummary: { type: String, default: '' },
  stage: { type: String, enum: STAGES, default: 'Applied' },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
module.exports.STAGES = STAGES;
