// backend/src/index.js

/**
 * Main entry point for Job Application SaaS backend API.
 * Initializes Express server with security middleware.
 *
 * Security-first approach:
 * - Helmet for HTTP headers
 * - CORS with strict policy
 * - Rate limiting
 * - JSON body parsing with size limits
 *
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB, isUsingFallback } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (with fallback to in-memory if unavailable)
connectDB().then((conn) => {
  if (conn) {
    console.log('MongoDB connected successfully');
  }
}).catch(err => {
  console.error('Error during database initialization:', err);
});

// Security HTTP headers
app.use(helmet());

// Enable CORS with strict policy (adjust origin in production)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Parse JSON bodies with size limit
app.use(express.json({ limit: '1mb' }));

// Add fallback warning middleware
const fallbackWarningMiddleware = require('./middleware/fallback-warning.middleware');
app.use(fallbackWarningMiddleware);

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'Backend API is running',
    databaseMode: isUsingFallback() ? 'in-memory-fallback' : 'mongodb',
    warning: isUsingFallback() ? 'Using in-memory storage. Data will not persist after server restart.' : null
  });
});

// Import and mount authentication routes
const authRouter = require('./auth/auth.routes');
app.use('/api/auth', authRouter);

// Import and mount matching preferences routes
const preferencesRouter = require('./preferences/preferences.routes');
app.use('/api/preferences', preferencesRouter);

// Import and mount resume upload routes
const resumeRouter = require('./resumes/resume.routes');
app.use('/api/resumes', resumeRouter);

// Import and mount user profile routes
const userRouter = require('./users/user.routes');
app.use('/api/users', userRouter);

// Import and mount AI routes for OpenRouter integration
const aiRouter = require('./ai/ai.routes');
app.use('/api/ai', aiRouter);

// Import and mount jobs routes
const jobsRouter = require('./jobs/jobs.routes');
app.use('/api/jobs', jobsRouter);

// TODO: Import and mount additional routers as needed

// Catch-all route to serve index.html for client-side routing
// This should come AFTER all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});