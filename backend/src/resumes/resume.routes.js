// backend/src/resumes/resume.routes.js

/**
 * Resume upload and retrieval routes.
 * Provides endpoints to upload, parse, and fetch resumes.
 */

const express = require('express');
const {
  uploadResume,
  uploadResumeWithAI,
  getResume,
  getUserResumes
} = require('./resume.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/resumes/upload
 * @desc Upload and parse a resume (PDF/DOCX) using basic parser
 * @access Private (JWT required)
 */
router.post(
  '/upload',
  authMiddleware,
  (req, res, next) => {
    uploadResume(req, res, (err) => {
      if (err) return next(err);
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }
    });
  }
);

/**
 * @route POST /api/resumes/upload/ai
 * @desc Upload and parse a resume (PDF/DOCX) using AI
 * @access Private (JWT required)
 */
router.post(
  '/upload/ai',
  authMiddleware,
  (req, res, next) => {
    uploadResumeWithAI(req, res, (err) => {
      if (err) return next(err);
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }
    });
  }
);

/**
 * @route GET /api/resumes/user
 * @desc Get all resumes for the current user
 * @access Private (JWT required)
 */
router.get('/user', authMiddleware, getUserResumes);

/**
 * @route GET /api/resumes/:id
 * @desc Get a specific resume by ID
 * @access Private (JWT required)
 */
router.get('/:id', authMiddleware, getResume);

module.exports = router;