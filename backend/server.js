require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
// CORS: in production, restrict to the Vercel frontend origin(s) via
// FRONTEND_URL (comma-separated if more than one). Locally, with no
// FRONTEND_URL set, allow all origins for easy development.
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : null;
app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error(`Not allowed by CORS: ${origin}`));
      }
    : true,
}));
app.use(express.json({ limit: '1mb' }));

connectDB();

app.get('/', (req, res) => res.json({ ok: true, service: 'HireLens API', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/match', require('./routes/match'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/interviews', require('./routes/interviews'));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Route not found' }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`HireLens API running on port ${PORT}`));
}
module.exports = app;
