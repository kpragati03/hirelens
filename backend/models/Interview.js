const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  candidateName: { type: String, required: true },
  jobTitle: { type: String, default: '' },
  company: { type: String, default: '' },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  mode: { type: String, default: 'Video' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Interview', InterviewSchema);
