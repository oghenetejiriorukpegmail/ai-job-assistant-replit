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

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(helmet());

// Enable CORS with strict policy (adjust origin in production)
app.use(cors({
  origin: 'http://localhost:3000',
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Backend API is running' });
});

// TODO: Import and use auth, user, resume, preference routers here
// Example:
// const authRouter = require('./auth/auth.routes');
// app.use('/api/auth', authRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});