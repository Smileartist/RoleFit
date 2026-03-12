require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const projectRoutes = require('./routes/project.routes');
const jobRoutes = require('./routes/job.routes');
const tailorRoutes = require('./routes/tailor.routes');
const applicationRoutes = require('./routes/application.routes');

const app = express();

// --------------- Middleware ---------------
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (dev only)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/tailor', tailorRoutes);
app.use('/api/applications', applicationRoutes);

// --------------- Error Handler ---------------
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ RoleFit API running on port ${PORT}`);
});

module.exports = app;
