/**
 * Google Jobs API Integration
 *
 * This module handles integration with the Google Jobs API.
 * It requires a Google Cloud API key to be set in environment variables.
 */

const axios = require('axios');
const { rateLimiters } = require('../utils/rate-limiter');
const logger = require('../../utils/logger');

// Google Jobs API configuration
const GOOGLE_JOBS_API_URL = 'https://jobs.googleapis.com/v4/jobs:search';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Rate limiter for Google Jobs API
const rateLimiter = rateLimiters.googleJobs;

/**
 * Check if Google Jobs API is configured
 * @returns {boolean} - True if configured, false otherwise
 */
function isConfigured() {
  return !!GOOGLE_API_KEY;
}

/**
 * Search for jobs using Google Jobs API
 * @param {Object} options - Search options
 * @param {string} options.keywords - Search keywords
 * @param {string} options.location - Job location
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.jobType - Job type (FULL_TIME, PART_TIME, CONTRACTOR, etc.)
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(options = {}) {
  if (!isConfigured()) {
    logger.warn('Google Jobs API is not configured. Skipping job search.');
    return [];
  }

  const {
    keywords = '',
    location = '',
    limit = 20,
    jobType = '',
    pageToken = ''
  } = options;

  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      // Build request payload
      const payload = {
        searchMode: 'JOB_SEARCH',
        requestMetadata: {
          userId: 'job-application-saas-user',
          sessionId: `job-application-saas-session-${Date.now()}`,
          domain: 'job-application-saas.com'
        },
        jobQuery: {
          query: keywords,
          locationFilters: location ? [{
            address: location
          }] : []
        },
        pageSize: limit
      };

      // Add job type filter if specified
      if (jobType) {
        payload.jobQuery.employmentTypes = [jobType];
      }

      // Add page token if specified
      if (pageToken) {
        payload.pageToken = pageToken;
      }

      const response = await axios.post(`${GOOGLE_JOBS_API_URL}?key=${GOOGLE_API_KEY}`, payload);

      return {
        jobs: response.data.matchingJobs || [],
        nextPageToken: response.data.nextPageToken
      };
    });
  } catch (error) {
    logger.error('Error searching Google Jobs:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Transform Google job data to standard format
 * @param {Object} googleJob - Google job data
 * @returns {Object} - Standardized job object
 */
function transformJobData(googleJob) {
  const job = googleJob.job || {};

  return {
    title: job.title || '',
    company: job.companyName || '',
    location: job.locations?.join(', ') || '',
    description: job.description || '',
    url: job.applicationInfo?.uris?.[0]?.uri || '',
    salary: job.compensationInfo ?
      `${job.compensationInfo.entries?.[0]?.min?.units || ''}-${job.compensationInfo.entries?.[0]?.max?.units || ''} ${job.compensationInfo.entries?.[0]?.unit || ''}` : '',
    source: 'google',
    sourceId: job.name?.split('/')?.[1] || '',
    postedDate: job.postingCreateTime ? new Date(job.postingCreateTime) : new Date(),
    skills: job.qualifications || []
  };
}

/**
 * Fetch jobs from Google Jobs with pagination
 * @param {Object} options - Search options
 * @param {number} maxPages - Maximum number of pages to fetch
 * @returns {Promise<Array>} - Array of job objects
 */
async function fetchJobsWithPagination(options = {}, maxPages = 3) {
  const allJobs = [];
  let currentPage = 1;
  let nextPageToken = '';

  while (currentPage <= maxPages) {
    const pageOptions = { ...options, pageToken: nextPageToken };
    const result = await searchJobs(pageOptions);

    if (!result.jobs || result.jobs.length === 0) {
      break; // No more results
    }

    allJobs.push(...result.jobs);

    if (!result.nextPageToken) {
      break; // No more pages
    }

    nextPageToken = result.nextPageToken;
    currentPage++;
  }

  return allJobs;
}

/**
 * Fetch jobs from Google Jobs
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobs(options = {}) {
  try {
    if (!isConfigured()) {
      logger.warn('Google Jobs API is not configured. Returning empty results.');
      return [];
    }

    // Search for jobs with pagination
    const jobResults = await fetchJobsWithPagination(options);
    logger.info(`Found ${jobResults.length} Google jobs matching criteria`);

    // Transform job data to standard format
    return jobResults.map(transformJobData);
  } catch (error) {
    logger.error('Error fetching Google jobs:', error);
    return [];
  }
}

module.exports = {
  fetchJobs,
  searchJobs,
  isConfigured
};
