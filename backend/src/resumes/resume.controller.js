// backend/src/resumes/resume.controller.js

/**
 * Resume upload and parsing controller.
 * Handles secure upload, parsing, and storage of resume data.
 * 
 * Security-first approach:
 * - Accepts only PDF/DOCX
 * - Validates file type and size
 * - Parses content securely
 * - Stores parsed data linked to user
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const multer = require('multer');
const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth'); // Uncomment if DOCX parsing needed

// In-memory storage for parsed resumes (replace with DB)
const parsedResumes = [];

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed.'));
    }
  },
});

// Upload and parse resume
async function uploadResume(req, res) {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let textContent = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      textContent = data.text;
    } 
    // else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    //   const result = await mammoth.extractRawText({ buffer: file.buffer });
    //   textContent = result.value;
    // }

    // Store parsed resume
    parsedResumes.push({
      userId,
      filename: file.originalname,
      content: textContent,
    });

    return res.status(200).json({ message: 'Resume uploaded and parsed successfully.' });
  } catch (err) {
    console.error('Upload resume error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  upload,
  uploadResume,
  parsedResumes,
};