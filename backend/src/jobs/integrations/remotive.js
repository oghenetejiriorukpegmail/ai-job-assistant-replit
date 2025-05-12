/**
 * Remotive Jobs API Integration
 * 
 * This module handles integration with the Remotive Jobs API.
 * It's a free and public API that doesn't require authentication.
 */

const axios = require('axios');
const { rateLimiters } = require('../utils/rate-limiter');
const logger = require('../../utils/logger');

// Remotive API configuration
const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

// Rate limiter for Remotive API
const rateLimiter = rateLimiters.remotive || rateLimiters.indeed; // Reuse Indeed's rate limiter if remotive's doesn't exist

/**
 * Check if Remotive API is configured
 * @returns {boolean} - Always returns true since Remotive API is public
 */
function isConfigured() {
  return true;
}

/**
 * Transform job data from Remotive API to standard format
 * @param {Object} job - Job data from Remotive API
 * @returns {Object} - Standardized job object
 */
function transformJobData(job) {
  return {
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || 'Remote',
    description: job.description,
    url: job.url,
    salary: job.salary || '',
    source: 'remotive',
    sourceId: `remotive-${job.id}`,
    postedDate: new Date(job.publication_date),
    skills: extractSkills(job.description),
    employmentType: job.job_type || 'Full-time',
    seniority: extractSeniority(job.title),
    jobFunction: job.category || '',
    industries: ''
  };
}

/**
 * Extract skills from job description
 * @param {string} description - Job description
 * @returns {Array} - Array of skills
 */
function extractSkills(description) {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'TypeScript',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind',
    'REST', 'GraphQL', 'API', 'Microservices', 'Serverless',
    'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence',
    'Linux', 'Windows', 'MacOS', 'Unix',
    'Network', 'Security', 'Firewall', 'VPN', 'TCP/IP',
    'Cisco', 'Juniper', 'Routing', 'Switching'
  ];
  
  const skills = [];
  if (description) {
    for (const skill of commonSkills) {
      if (description.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }
  }
  
  return skills.slice(0, 10); // Limit to 10 skills
}

/**
 * Extract seniority from job title
 * @param {string} title - Job title
 * @returns {string} - Seniority level
 */
function extractSeniority(title) {
  const title_lower = title.toLowerCase();
  
  if (title_lower.includes('senior') || title_lower.includes('sr.') || title_lower.includes('lead') || title_lower.includes('principal')) {
    return 'Senior level';
  } else if (title_lower.includes('junior') || title_lower.includes('jr.') || title_lower.includes('entry')) {
    return 'Entry level';
  } else if (title_lower.includes('manager') || title_lower.includes('director') || title_lower.includes('head')) {
    return 'Manager';
  } else if (title_lower.includes('intern') || title_lower.includes('trainee')) {
    return 'Internship';
  } else {
    return 'Mid level';
  }
}

/**
 * Fetch jobs from Remotive API
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of standardized job objects
 */
async function fetchJobs(options = {}) {
  const { keywords = '', location = '', limit = 20 } = options;
  
  try {
    // Use rate limiter to avoid being blocked
    return await rateLimiter.execute(async () => {
      logger.info(`Fetching jobs from Remotive API with keywords: ${keywords}, location: ${location}`);
      
      // Build search parameters
      const params = {};
      if (keywords) params.search = keywords;
      if (limit) params.limit = limit;
      
      // Make the request
      const response = await axios.get(REMOTIVE_API_URL, { params });
      
      // Check if response contains jobs
      if (!response.data || !response.data.jobs || !Array.isArray(response.data.jobs)) {
        logger.warn('Invalid response from Remotive API');
        return [];
      }
      
      // Filter jobs by location if specified
      let jobs = response.data.jobs;
      if (location && location.toLowerCase() !== 'remote') {
        jobs = jobs.filter(job => 
          job.candidate_required_location && 
          job.candidate_required_location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      // Limit the number of jobs
      jobs = jobs.slice(0, limit);
      
      logger.info(`Found ${jobs.length} jobs from Remotive API`);
      
      // Transform job data to standard format
      return jobs.map(transformJobData);
    });
  } catch (error) {
    logger.error('Error fetching jobs from Remotive API:', error.message);
    return [];
  }
}

module.exports = {
  fetchJobs,
  isConfigured
};
