/**
 * Glassdoor Jobs API Integration
 * 
 * This module handles integration with the Glassdoor Jobs API.
 * It requires Glassdoor API credentials to be set in environment variables.
 */

const axios = require('axios');
const { rateLimiters } = require('../utils/rate-limiter');
const logger = require('../../utils/logger');

// Glassdoor API configuration
const GLASSDOOR_API_URL = 'https://api.glassdoor.com/api/api.htm';
const GLASSDOOR_PARTNER_ID = process.env.GLASSDOOR_PARTNER_ID;
const GLASSDOOR_API_KEY = process.env.GLASSDOOR_API_KEY;

// Rate limiter for Glassdoor API
const rateLimiter = rateLimiters.glassdoor;

/**
 * Check if Glassdoor API is configured
 * @returns {boolean} - True if configured, false otherwise
 */
function isConfigured() {
  return !!(GLASSDOOR_PARTNER_ID && GLASSDOOR_API_KEY);
}

/**
 * Search for jobs on Glassdoor
 * @param {Object} options - Search options
 * @param {string} options.keywords - Search keywords
 * @param {string} options.location - Job location
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(options = {}) {
  if (!isConfigured()) {
    logger.warn('Glassdoor API is not configured. Skipping job search.');
    return [];
  }

  const { 
    keywords = '', 
    location = '', 
    limit = 20,
    page = 1
  } = options;
  
  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      const response = await axios.get(GLASSDOOR_API_URL, {
        params: {
          v: '1',
          format: 'json',
          't.p': GLASSDOOR_PARTNER_ID,
          't.k': GLASSDOOR_API_KEY,
          action: 'jobs',
          q: keywords,
          l: location,
          ps: limit,
          pn: page,
          userip: '0.0.0.0', // Required by Glassdoor API
          useragent: 'JobApplicationSaaS' // Required by Glassdoor API
        }
      });
      
      return response.data.response.jobListings || [];
    });
  } catch (error) {
    logger.error('Error searching Glassdoor jobs:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get details for a specific job
 * @param {string} jobId - Glassdoor job ID
 * @returns {Promise<Object>} - Job details
 */
async function getJobDetails(jobId) {
  if (!isConfigured()) {
    logger.warn('Glassdoor API is not configured. Skipping job details fetch.');
    throw new Error('Glassdoor API is not configured');
  }

  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      const response = await axios.get(GLASSDOOR_API_URL, {
        params: {
          v: '1',
          format: 'json',
          't.p': GLASSDOOR_PARTNER_ID,
          't.k': GLASSDOOR_API_KEY,
          action: 'jobs-details',
          jobId,
          userip: '0.0.0.0', // Required by Glassdoor API
          useragent: 'JobApplicationSaaS' // Required by Glassdoor API
        }
      });
      
      return response.data.response.jobDetail || null;
    });
  } catch (error) {
    logger.error(`Error fetching Glassdoor job details for ${jobId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Transform Glassdoor job data to standard format
 * @param {Object} glassdoorJob - Glassdoor job data
 * @returns {Object} - Standardized job object
 */
function transformJobData(glassdoorJob) {
  return {
    title: glassdoorJob.jobTitle || '',
    company: glassdoorJob.employer || glassdoorJob.employerName || '',
    location: glassdoorJob.location || '',
    description: glassdoorJob.jobDescription || glassdoorJob.description || '',
    url: glassdoorJob.jobViewUrl || '',
    salary: glassdoorJob.salarySource ? `${glassdoorJob.salarySource.payPeriod} ${glassdoorJob.salarySource.payLow}-${glassdoorJob.salarySource.payHigh} ${glassdoorJob.salarySource.currency}` : '',
    source: 'glassdoor',
    sourceId: glassdoorJob.jobListingId || '',
    postedDate: glassdoorJob.listingDate ? new Date(glassdoorJob.listingDate) : new Date(),
    skills: []
  };
}

/**
 * Fetch jobs from Glassdoor with pagination
 * @param {Object} options - Search options
 * @param {number} maxPages - Maximum number of pages to fetch
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobsWithPagination(options = {}, maxPages = 3) {
  const allJobs = [];
  let currentPage = 1;
  
  while (currentPage <= maxPages) {
    const pageOptions = { ...options, page: currentPage };
    const jobs = await searchJobs(pageOptions);
    
    if (jobs.length === 0) {
      break; // No more results
    }
    
    allJobs.push(...jobs);
    currentPage++;
  }
  
  return allJobs;
}

/**
 * Fetch jobs from Glassdoor
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobs(options = {}) {
  try {
    if (!isConfigured()) {
      logger.warn('Glassdoor API is not configured. Returning empty results.');
      return [];
    }

    // Search for jobs with pagination
    const jobResults = await fetchJobsWithPagination(options);
    logger.info(`Found ${jobResults.length} Glassdoor jobs matching criteria`);
    
    // Get details for each job and transform data
    const jobsWithDetails = await Promise.all(
      jobResults.map(async (job) => {
        try {
          const jobId = job.jobListingId;
          const details = await getJobDetails(jobId);
          return transformJobData({ ...job, ...details });
        } catch (error) {
          logger.warn(`Skipping Glassdoor job due to error:`, error.message);
          return transformJobData(job); // Fall back to basic data if details fetch fails
        }
      })
    );
    
    return jobsWithDetails;
  } catch (error) {
    logger.error('Error fetching Glassdoor jobs:', error);
    return [];
  }
}

module.exports = {
  fetchJobs,
  searchJobs,
  getJobDetails,
  isConfigured
};
