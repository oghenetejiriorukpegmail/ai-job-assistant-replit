// backend/src/resumes/resume.routes.js

/**
 * Resume upload routes for Job Application SaaS backend.
 * Provides endpoint to upload and parse resumes.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { upload, uploadResume } = require('./resume.controller');
const { authenticateJWT } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/resumes/upload
 * @desc Upload and parse a resume (PDF/DOCX)
 * @access Private (JWT required)
 */
router.post('/upload', authenticateJWT, upload.single('resume'), uploadResume);

module.exports = router;