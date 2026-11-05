const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  challengeId: { type: String, required: true },
  challengeTitle: { type: String, required: true },
  candidateName: { type: String, default: '' },
  candidateEmail: { type: String, default: '' },
  code: { type: String, default: '' },
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  correctness: { type: Number, default: 0 },
  efficiency: { type: Number, default: 0 },
  readability: { type: Number, default: 0 },
  feedback: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
