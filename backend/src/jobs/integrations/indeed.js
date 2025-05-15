/**
 * Indeed Jobs API Integration
 *
 * This module handles integration with the Indeed Jobs API.
 * It requires Indeed API credentials to be set in environment variables.
 */

const axios = require('axios');
const { rateLimiters } = require('../utils/rate-limiter');
const logger = require('../../utils/logger');

// Indeed API configuration
const INDEED_API_URL = 'https://api.indeed.com/ads/apisearch';
const INDEED_PUBLISHER_ID = process.env.INDEED_PUBLISHER_ID;
const INDEED_API_KEY = process.env.INDEED_API_KEY;

// Rate limiter for Indeed API
const rateLimiter = rateLimiters.indeed;

/**
 * Check if Indeed API is configured
 * @returns {boolean} - True if configured, false otherwise
 */
function isConfigured() {
  return !!(INDEED_PUBLISHER_ID && INDEED_API_KEY);
}

/**
 * Search for jobs on Indeed
 * @param {Object} options - Search options
 * @param {string} options.keywords - Search keywords
 * @param {string} options.location - Job location
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.radius - Search radius in miles
 * @param {string} options.jobType - Job type (fulltime, parttime, contract, etc.)
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(options = {}) {
  if (!isConfigured()) {
    logger.warn('Indeed API is not configured. Skipping job search.');
    return [];
  }

  const {
    keywords = '',
    location = '',
    limit = 25,
    radius = 25,
    jobType = '',
    page = 1
  } = options;

  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      const response = await axios.get(INDEED_API_URL, {
        params: {
          publisher: INDEED_PUBLISHER_ID,
          v: 2,
          format: 'json',
          q: keywords,
          l: location,
          limit,
          radius,
          jt: jobType,
          start: (page - 1) * limit,
          userip: '1.2.3.4', // Required by Indeed API
          useragent: 'JobApplicationSaaS' // Required by Indeed API
        }
      });

      return response.data.results || [];
    });
  } catch (error) {
    logger.error('Error searching Indeed jobs:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Transform Indeed job data to standard format
 * @param {Object} indeedJob - Indeed job data
 * @returns {Object} - Standardized job object
 */
function transformJobData(indeedJob) {
  return {
    title: indeedJob.jobtitle || '',
    company: indeedJob.company || '',
    location: indeedJob.formattedLocation || indeedJob.city || '',
    description: indeedJob.snippet || '',
    url: indeedJob.url || '',
    salary: indeedJob.formattedRelativeTime || '',
    source: 'indeed',
    sourceId: indeedJob.jobkey || '',
    postedDate: indeedJob.date ? new Date(indeedJob.date) : new Date(),
    skills: []
  };
}

/**
 * Fetch jobs from Indeed with pagination
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
 * Fetch jobs from Indeed
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobs(options = {}) {
  try {
    if (!isConfigured()) {
      logger.warn('Indeed API is not configured. Returning empty results.');
      return [];
    }

    // Search for jobs with pagination
    const jobResults = await fetchJobsWithPagination(options);
    logger.info(`Found ${jobResults.length} Indeed jobs matching criteria`);

    // Transform job data to standard format
    return jobResults.map(transformJobData);
  } catch (error) {
    logger.error('Error fetching Indeed jobs:', error);
    return [];
  }
}

module.exports = {
  fetchJobs,
  searchJobs,
  isConfigured
};
