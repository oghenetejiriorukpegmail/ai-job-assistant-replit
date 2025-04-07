// backend/src/resumes/resume.routes.js

/**
 * Resume upload and retrieval routes.
 * Provides endpoints to upload, parse, and fetch resumes.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { upload, uploadResume, parsedResumes } = require('./resume.controller');
const { authenticateJWT } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/resumes/upload
 * @desc Upload and parse a resume (PDF/DOCX)
 * @access Private (JWT required)
 */
router.post('/upload', authenticateJWT, upload.single('resume'), uploadResume);

/**
 * @route GET /api/resumes/user
 * @desc Get current user's parsed resume
 * @access Private (JWT required)
 */
router.get('/user', authenticateJWT, (req, res) => {
  try {
    const userId = req.user.userId;
    const resume = parsedResumes.find(r => r.userId === userId);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    return res.status(200).json(resume);
  } catch (err) {
    console.error('Fetch resume error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;