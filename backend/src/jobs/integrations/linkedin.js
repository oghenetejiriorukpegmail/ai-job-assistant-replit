/**
 * LinkedIn Jobs Integration
 *
 * This module handles integration with LinkedIn Jobs.
 * It supports both API and web scraping approaches.
 * The API approach requires LinkedIn API credentials to be set in environment variables.
 * The web scraping approach is used as a fallback when API fails or is not configured.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { rateLimiters } = require('../utils/rate-limiter');
const logger = require('../../utils/logger');

// LinkedIn API configuration
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

// LinkedIn web scraping configuration
const LINKEDIN_JOBS_URL = 'https://www.linkedin.com/jobs/search';

// Rate limiter for LinkedIn API and web scraping
const rateLimiter = rateLimiters.linkedin;

/**
 * Check if LinkedIn API is configured
 * @returns {boolean} - True if configured, false otherwise
 */
function isConfigured() {
  return !!(LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET && LINKEDIN_ACCESS_TOKEN);
}

/**
 * Get headers for LinkedIn API requests
 * @returns {Object} - Headers object
 */
function getHeaders() {
  return {
    'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0'
  };
}

/**
 * Search for jobs on LinkedIn
 * @param {Object} options - Search options
 * @param {string} options.keywords - Search keywords
 * @param {string} options.location - Job location
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(options = {}) {
  if (!isConfigured()) {
    logger.warn('LinkedIn API is not configured. Skipping job search.');
    return [];
  }

  const { keywords = '', location = '', limit = 20 } = options;

  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      const response = await axios.get(`${LINKEDIN_API_URL}/jobSearch`, {
        headers: getHeaders(),
        params: {
          keywords,
          location,
          count: limit
        }
      });

      return response.data.elements || [];
    });
  } catch (error) {
    logger.error('Error searching LinkedIn jobs:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get details for a specific job
 * @param {string} jobId - LinkedIn job ID
 * @returns {Promise<Object>} - Job details
 */
async function getJobDetails(jobId) {
  if (!isConfigured()) {
    logger.warn('LinkedIn API is not configured. Skipping job details fetch.');
    throw new Error('LinkedIn API is not configured');
  }

  try {
    // Use rate limiter to avoid exceeding API limits
    return await rateLimiter.execute(async () => {
      const response = await axios.get(`${LINKEDIN_API_URL}/jobs/${jobId}`, {
        headers: getHeaders()
      });

      return response.data;
    });
  } catch (error) {
    logger.error(`Error fetching LinkedIn job details for ${jobId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Transform LinkedIn job data to standard format
 * @param {Object} linkedinJob - LinkedIn job data
 * @returns {Object} - Standardized job object
 */
function transformJobData(linkedinJob) {
  return {
    title: linkedinJob.title?.text || '',
    company: linkedinJob.companyDetails?.company?.name || '',
    location: linkedinJob.formattedLocation || '',
    description: linkedinJob.description?.text || '',
    url: linkedinJob.applyMethod?.companyApplyUrl || `https://www.linkedin.com/jobs/view/${linkedinJob.entityUrn.split(':').pop()}`,
    salary: linkedinJob.compensation ? `${linkedinJob.compensation.min || ''} - ${linkedinJob.compensation.max || ''} ${linkedinJob.compensation.currency || ''}` : '',
    source: 'linkedin',
    sourceId: linkedinJob.entityUrn.split(':').pop(),
    postedDate: linkedinJob.listedAt ? new Date(linkedinJob.listedAt) : new Date(),
    skills: linkedinJob.requiredSkills || []
  };
}

/**
 * Scrape jobs from LinkedIn website
 * @param {Object} options - Search options
 * @param {string} options.keywords - Search keywords
 * @param {string} options.location - Job location
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeJobs(options = {}) {
  const { keywords = '', location = '', limit = 20 } = options;

  try {
    // Use rate limiter to avoid being blocked
    return await rateLimiter.execute(async () => {
      // Build search URL
      const searchUrl = new URL(LINKEDIN_JOBS_URL);
      searchUrl.searchParams.append('keywords', keywords);
      if (location) searchUrl.searchParams.append('location', location);
      searchUrl.searchParams.append('f_TPR', 'r86400'); // Last 24 hours
      searchUrl.searchParams.append('position', 1);
      searchUrl.searchParams.append('pageNum', 0);

      // Set up headers to mimic a browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.linkedin.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      };

      // Make the request
      const response = await axios.get(searchUrl.toString(), { headers });

      // Parse HTML
      const $ = cheerio.load(response.data);
      const jobs = [];

      // Extract job listings
      $('.job-search-card').each((i, el) => {
        if (i >= limit) return false; // Limit results

        const jobId = $(el).attr('data-id') || $(el).attr('data-job-id');
        const jobTitle = $(el).find('.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim();
        const location = $(el).find('.job-search-card__location').text().trim();
        const listedTime = $(el).find('.job-search-card__listdate').text().trim() ||
                          $(el).find('time').attr('datetime');
        const jobUrl = $(el).find('a.base-card__full-link').attr('href');

        // Only add if we have at least a job ID and title
        if (jobId && jobTitle) {
          jobs.push({
            id: jobId,
            title: jobTitle,
            company,
            location,
            listedTime,
            url: jobUrl,
            source: 'linkedin'
          });
        }
      });

      logger.info(`Scraped ${jobs.length} LinkedIn jobs matching criteria`);
      return jobs;
    });
  } catch (error) {
    logger.error('Error scraping LinkedIn jobs:', error.message);
    return [];
  }
}

/**
 * Scrape job details from LinkedIn
 * @param {string} jobUrl - LinkedIn job URL
 * @returns {Promise<Object>} - Job details
 */
async function scrapeJobDetails(jobUrl) {
  try {
    // Use rate limiter to avoid being blocked
    return await rateLimiter.execute(async () => {
      // Set up headers to mimic a browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.linkedin.com/jobs',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };

      // Make the request
      const response = await axios.get(jobUrl, { headers });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Extract job details
      const description = $('.description__text').text().trim();
      const criteria = $('.description__job-criteria-item');
      let seniority = '';
      let employmentType = '';
      let jobFunction = '';
      let industries = '';

      criteria.each((i, el) => {
        const label = $(el).find('.description__job-criteria-subheader').text().trim();
        const value = $(el).find('.description__job-criteria-text').text().trim();

        if (label.includes('Seniority')) seniority = value;
        else if (label.includes('Employment')) employmentType = value;
        else if (label.includes('Function')) jobFunction = value;
        else if (label.includes('Industries')) industries = value;
      });

      return {
        description,
        seniority,
        employmentType,
        jobFunction,
        industries
      };
    });
  } catch (error) {
    logger.error(`Error scraping LinkedIn job details:`, error.message);
    return {};
  }
}

/**
 * Transform scraped LinkedIn job data to standard format
 * @param {Object} scrapedJob - Scraped LinkedIn job data
 * @param {Object} details - Scraped job details
 * @returns {Object} - Standardized job object
 */
function transformScrapedJobData(scrapedJob, details = {}) {
  // Parse posted date
  let postedDate = new Date();
  if (scrapedJob.listedTime) {
    if (scrapedJob.listedTime.includes('hour')) {
      // e.g., "2 hours ago"
      const hours = parseInt(scrapedJob.listedTime.match(/\d+/)[0], 10) || 0;
      postedDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    } else if (scrapedJob.listedTime.includes('day')) {
      // e.g., "2 days ago"
      const days = parseInt(scrapedJob.listedTime.match(/\d+/)[0], 10) || 0;
      postedDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    } else if (scrapedJob.listedTime.includes('week')) {
      // e.g., "2 weeks ago"
      const weeks = parseInt(scrapedJob.listedTime.match(/\d+/)[0], 10) || 0;
      postedDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
    } else if (scrapedJob.listedTime.includes('month')) {
      // e.g., "2 months ago"
      const months = parseInt(scrapedJob.listedTime.match(/\d+/)[0], 10) || 0;
      postedDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);
    } else if (/\d{4}-\d{2}-\d{2}/.test(scrapedJob.listedTime)) {
      // ISO date format
      postedDate = new Date(scrapedJob.listedTime);
    }
  }

  return {
    title: scrapedJob.title || '',
    company: scrapedJob.company || '',
    location: scrapedJob.location || '',
    description: details.description || '',
    url: scrapedJob.url || '',
    salary: '',  // LinkedIn rarely shows salary in listings
    source: 'linkedin',
    sourceId: scrapedJob.id,
    postedDate,
    skills: [],  // LinkedIn doesn't explicitly list skills in a structured way
    employmentType: details.employmentType || '',
    seniority: details.seniority || '',
    jobFunction: details.jobFunction || '',
    industries: details.industries || ''
  };
}

/**
 * Fetch jobs from LinkedIn
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobs(options = {}) {
  try {
    // Try API approach first if configured
    if (isConfigured()) {
      try {
        // Search for jobs
        const jobResults = await searchJobs(options);
        logger.info(`Found ${jobResults.length} LinkedIn jobs via API`);

        // Get details for each job and transform data
        const jobsWithDetails = await Promise.all(
          jobResults.map(async (job) => {
            try {
              const jobId = job.entityUrn.split(':').pop();
              const details = await getJobDetails(jobId);
              return transformJobData({ ...job, ...details });
            } catch (error) {
              logger.warn(`Skipping LinkedIn job due to error:`, error.message);
              return null;
            }
          })
        );

        // Filter out null results (failed fetches)
        const validJobs = jobsWithDetails.filter(Boolean);
        if (validJobs.length > 0) {
          return validJobs;
        }

        // If no valid jobs found via API, fall back to scraping
        logger.info('No valid jobs found via LinkedIn API, falling back to web scraping');
      } catch (error) {
        logger.warn('Error using LinkedIn API, falling back to web scraping:', error.message);
      }
    } else {
      logger.info('LinkedIn API is not configured, using web scraping approach');
    }

    // Web scraping approach
    const scrapedJobs = await scrapeJobs(options);

    // Get details for each job and transform data
    const jobsWithDetails = await Promise.all(
      scrapedJobs.map(async (job) => {
        try {
          if (job.url) {
            const details = await scrapeJobDetails(job.url);
            return transformScrapedJobData(job, details);
          }
          return transformScrapedJobData(job);
        } catch (error) {
          logger.warn(`Skipping LinkedIn job due to error:`, error.message);
          return transformScrapedJobData(job); // Return basic data if details fetch fails
        }
      })
    );

    return jobsWithDetails;
  } catch (error) {
    logger.error('Error fetching LinkedIn jobs:', error);
    return [];
  }
}

module.exports = {
  fetchJobs,
  searchJobs,
  getJobDetails,
  scrapeJobs,
  scrapeJobDetails,
  isConfigured
};
