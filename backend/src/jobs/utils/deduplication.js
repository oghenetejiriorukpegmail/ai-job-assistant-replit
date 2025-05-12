/**
 * Job Deduplication Utilities
 * 
 * This module provides utilities for detecting and handling duplicate job listings.
 */

const { Job } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Normalize a URL by removing query parameters and trailing slashes
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  try {
    // Remove query parameters and hash
    const urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';
    
    // Remove trailing slash
    let normalized = urlObj.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized.toLowerCase();
  } catch (error) {
    logger.warn('Error normalizing URL:', error);
    return url.toLowerCase();
  }
}

/**
 * Generate a fingerprint for a job listing
 * @param {Object} job - Job object
 * @returns {string} - Job fingerprint
 */
function generateFingerprint(job) {
  // Create a fingerprint based on company, title, and location
  const company = (job.company || '').toLowerCase().trim();
  const title = (job.title || '').toLowerCase().trim();
  const location = (job.location || '').toLowerCase().trim();
  
  return `${company}|${title}|${location}`;
}

/**
 * Check if a job is a duplicate
 * @param {Object} job - Job object to check
 * @returns {Promise<boolean>} - True if duplicate, false otherwise
 */
async function checkDuplicate(job) {
  try {
    // Check by source ID if available
    if (job.source && job.sourceId) {
      const existingBySourceId = await Job.findOne({
        source: job.source,
        sourceId: job.sourceId
      });
      
      if (existingBySourceId) {
        logger.debug(`Duplicate job found by source ID: ${job.source}/${job.sourceId}`);
        return true;
      }
    }
    
    // Check by URL
    if (job.url) {
      const normalizedUrl = normalizeUrl(job.url);
      const existingByUrl = await Job.findOne({ 
        normalizedUrl: normalizedUrl 
      });
      
      if (existingByUrl) {
        logger.debug(`Duplicate job found by URL: ${normalizedUrl}`);
        return true;
      }
    }
    
    // Check by fingerprint
    const fingerprint = generateFingerprint(job);
    const existingByFingerprint = await Job.findOne({ 
      fingerprint: fingerprint 
    });
    
    if (existingByFingerprint) {
      logger.debug(`Duplicate job found by fingerprint: ${fingerprint}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking for duplicate job:', error);
    // In case of error, assume it's not a duplicate to avoid missing jobs
    return false;
  }
}

/**
 * Update an existing job with new information
 * @param {Object} existingJob - Existing job document
 * @param {Object} newJobData - New job data
 * @returns {Promise<Object>} - Updated job
 */
async function updateExistingJob(existingJob, newJobData) {
  try {
    // Update fields that might have changed
    existingJob.description = newJobData.description || existingJob.description;
    existingJob.salary = newJobData.salary || existingJob.salary;
    existingJob.isActive = true; // Mark as active again
    existingJob.lastUpdated = new Date();
    
    await existingJob.save();
    logger.debug(`Updated existing job: ${existingJob._id}`);
    
    return existingJob;
  } catch (error) {
    logger.error('Error updating existing job:', error);
    throw error;
  }
}

module.exports = {
  normalizeUrl,
  generateFingerprint,
  checkDuplicate,
  updateExistingJob
};
