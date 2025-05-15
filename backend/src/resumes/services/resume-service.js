// backend/src/resumes/services/resume-service.js

const { Resume } = require('../../models');
const { isUsingFallback, getInMemoryStore } = require('../../config/database');

// In-memory storage for parsed resumes (used as fallback)
const parsedResumes = [];

/**
 * Store parsed resume data
 * @param {string} userId - User ID
 * @param {Object} resumeData - Structured resume data
 * @param {Object} fileInfo - File information
 * @returns {string|number} - Resume ID
 */
async function storeResumeData(userId, resumeData, fileInfo = {}) {
  try {
    if (isUsingFallback()) {
      // Store in memory if database is not available
      const resumeId = parsedResumes.length;
      const resumeEntry = {
        id: resumeId,
        userId,
        structured: resumeData,
        createdAt: new Date()
      };

      parsedResumes.push(resumeEntry);

      // Also store in the in-memory database
      const resumes = getInMemoryStore().resumes;
      resumes.push(resumeEntry);

      return Promise.resolve(resumeId);
    } else {
      // Store in MongoDB
      const resume = new Resume({
        userId,
        structured: resumeData,
        filename: fileInfo.filename || 'resume.pdf',
        fileType: fileInfo.fileType || 'pdf',
        filePath: fileInfo.filePath || '',
        fileSize: fileInfo.fileSize || 0,
        status: 'completed',
        provider: fileInfo.provider || 'openrouter'
      });

      await resume.save();
      return Promise.resolve(resume._id);
    }
  } catch (error) {
    console.error('Error storing resume data:', error);
    return Promise.reject(error);
  }
}

/**
 * Get resume data by ID
 * @param {string|number} resumeId - Resume ID
 * @returns {Object|null} - Resume data or null if not found
 */
async function getResumeById(resumeId) {
  try {
    if (isUsingFallback()) {
      // Get from in-memory storage
      return Promise.resolve(parsedResumes[resumeId] || null);
    } else {
      // Get from MongoDB
      const resume = await Resume.findById(resumeId);
      return Promise.resolve(resume);
    }
  } catch (error) {
    console.error('Error getting resume by ID:', error);
    return Promise.resolve(null);
  }
}

/**
 * Get all resumes for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of resume data
 */
async function getResumesByUserId(userId) {
  try {
    if (isUsingFallback()) {
      // Get from in-memory storage
      const resumes = parsedResumes.filter(resume => resume.userId === userId);
      return Promise.resolve(resumes);
    } else {
      // Get from MongoDB
      const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
      return Promise.resolve(resumes);
    }
  } catch (error) {
    console.error('Error getting resumes by user ID:', error);
    return Promise.resolve([]);
  }
}

module.exports = {
  parsedResumes,
  storeResumeData,
  getResumeById,
  getResumesByUserId
};
