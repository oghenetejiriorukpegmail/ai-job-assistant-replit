/**
 * Jobs controller
 * Handles job matching and related operations
 */

const { Job, Resume, Preference, CrawlJob } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');
const jobService = require('./services/job-service');
const crawlerService = require('./services/crawler-service');
const jobIntegrations = require('./integrations');
const logger = require('../utils/logger');
const exportService = require('../services/export-service');

// Sample jobs for development (when no jobs in database)
const sampleJobs = [
  {
    id: 1,
    title: 'Software Engineer',
    company: 'Tech Innovations Inc.',
    location: 'San Francisco, CA',
    description: 'Developing cutting-edge web applications using React and Node.js.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    url: 'https://example.com/jobs/1'
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: 'Digital Solutions',
    location: 'Remote',
    description: 'Building responsive user interfaces with modern JavaScript frameworks.',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js'],
    url: 'https://example.com/jobs/2'
  },
  {
    id: 3,
    title: 'Full Stack Developer',
    company: 'Growth Startup',
    location: 'New York, NY',
    description: 'Working on all aspects of our SaaS platform from frontend to backend.',
    skills: ['JavaScript', 'Python', 'React', 'Django', 'PostgreSQL'],
    url: 'https://example.com/jobs/3'
  },
  {
    id: 4,
    title: 'Backend Engineer',
    company: 'Data Systems Inc.',
    location: 'Austin, TX',
    description: 'Developing scalable APIs and microservices.',
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'Kubernetes'],
    url: 'https://example.com/jobs/4'
  },
  {
    id: 5,
    title: 'DevOps Engineer',
    company: 'Cloud Solutions',
    location: 'Seattle, WA',
    description: 'Managing cloud infrastructure and CI/CD pipelines.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
    url: 'https://example.com/jobs/5'
  }
];

/**
 * Get matched jobs based on user preferences and resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} - Matched jobs
 */
async function getMatchedJobs(req, res) {
  try {
    const userId = req.user.id;

    // Get user preferences
    let preferences;
    if (isUsingFallback()) {
      const prefsStore = getInMemoryStore().preferences;
      preferences = prefsStore.find(p => p.userId === userId.toString());
    } else {
      preferences = await Preference.findOne({ userId });
    }

    // Default to resume mode if no preferences found
    const matchMode = preferences?.mode || 'resume';

    // Get jobs from database or fallback to sample jobs
    let jobs;
    if (isUsingFallback()) {
      const jobsStore = getInMemoryStore().jobs;
      jobs = jobsStore.length > 0 ? jobsStore : sampleJobs;
    } else {
      jobs = await Job.find({ isActive: true }).limit(20);

      // If no jobs in database, use sample jobs
      if (jobs.length === 0) {
        jobs = sampleJobs;
      }
    }

    // Match jobs based on preferences
    let matchedJobs = [];

    if (matchMode === 'titles') {
      // Match based on job titles
      const jobTitles = preferences?.jobTitles || [];

      if (jobTitles.length > 0) {
        // Create regex patterns for each job title
        const patterns = jobTitles.map(title => new RegExp(title, 'i'));

        // Filter jobs that match any of the patterns
        matchedJobs = jobs.filter(job =>
          patterns.some(pattern => pattern.test(job.title))
        );
      } else {
        // No job titles specified, return all jobs
        matchedJobs = jobs;
      }
    } else {
      // Match based on resume
      // Get user's resume
      let resume;
      if (isUsingFallback()) {
        const resumesStore = getInMemoryStore().resumes;
        resume = resumesStore.find(r => r.userId === userId.toString());
      } else {
        resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
      }

      if (resume && resume.structured && resume.structured.skills) {
        // Extract skills from resume
        const userSkills = resume.structured.skills.map(skill =>
          typeof skill === 'string' ? skill.toLowerCase() : ''
        ).filter(Boolean);

        // Score jobs based on skill match
        const scoredJobs = jobs.map(job => {
          const jobSkills = (job.skills || []).map(skill =>
            typeof skill === 'string' ? skill.toLowerCase() : ''
          ).filter(Boolean);

          // Count matching skills
          const matchingSkills = userSkills.filter(skill =>
            jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
          );

          // Calculate match score (0-100)
          const score = jobSkills.length > 0
            ? Math.round((matchingSkills.length / jobSkills.length) * 100)
            : 0;

          return { ...job, score };
        });

        // Sort by score (descending) and take top matches
        matchedJobs = scoredJobs
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
      } else {
        // No resume or skills found, return all jobs
        matchedJobs = jobs;
      }
    }

    return res.status(200).json(matchedJobs);
  } catch (error) {
    console.error('Get matched jobs error:', error);
    return res.status(500).json({ error: 'Failed to get matched jobs' });
  }
}

/**
 * Search for jobs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Search results
 */
async function searchJobs(req, res) {
  try {
    const {
      keywords,
      location,
      company,
      source,
      minSalary,
      maxSalary,
      jobType,
      remote,
      skills,
      page = 1,
      limit = 20,
      sort = 'recent'
    } = req.query;

    // Build query object
    const query = {};

    if (keywords) query.keywords = keywords;
    if (location) query.location = location;
    if (company) query.company = company;
    if (source) query.source = source;
    if (minSalary) query.minSalary = parseInt(minSalary);
    if (maxSalary) query.maxSalary = parseInt(maxSalary);
    if (jobType) query.jobType = jobType;
    if (remote !== undefined) query.remote = remote === 'true';
    if (skills) query.skills = Array.isArray(skills) ? skills : [skills];

    // Build options object
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Set sort order
    switch (sort) {
      case 'recent':
        options.sort = { postedDate: -1 };
        break;
      case 'salary':
        options.sort = { salary: -1 };
        break;
      case 'title':
        options.sort = { title: 1 };
        break;
      case 'company':
        options.sort = { company: 1 };
        break;
      default:
        options.sort = { postedDate: -1 };
    }

    // Search jobs
    const results = await jobService.searchJobs(query, options);

    return res.status(200).json(results);
  } catch (error) {
    logger.error('Error searching jobs:', error);
    return res.status(500).json({ error: 'Failed to search jobs' });
  }
}

/**
 * Get a job by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Job object
 */
async function getJobById(req, res) {
  try {
    const { id } = req.params;
    
    // Validate id is a valid MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const job = await jobService.getJobById(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json(job);
  } catch (error) {
    logger.error(`Error getting job by ID ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to retrieve job' });
  }
}

/**
 * Get similar jobs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} - Array of similar job objects
 */
async function getSimilarJobs(req, res) {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    // Validate id is a valid MongoDB ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    // Validate limit is a positive integer
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Limit must be a positive integer' });
    }

    const similarJobs = await jobService.getSimilarJobs(id, parsedLimit);

    return res.status(200).json(similarJobs);
  } catch (error) {
    logger.error(`Error getting similar jobs for job ID ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to get similar jobs' });
  }
}

/**
 * Start a job crawl
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Crawl job info
 */
async function startCrawl(req, res) {
  try {
    const { source = 'all', searchParams = {}, saveJobs = true } = req.body;

    // Validate source
    if (source !== 'all' && !jobIntegrations.availableSources.includes(source)) {
      return res.status(400).json({
        error: `Invalid source. Available sources: ${jobIntegrations.availableSources.join(', ')} or 'all'`
      });
    }

    // Start crawl
    const crawlJob = await crawlerService.startCrawl({
      source,
      searchParams,
      saveJobs
    });

    return res.status(200).json(crawlJob);
  } catch (error) {
    logger.error('Error starting job crawl:', error);
    return res.status(500).json({ error: 'Failed to start job crawl' });
  }
}

/**
 * Get crawl status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Crawl status
 */
async function getCrawlStatus(req, res) {
  try {
    const { id } = req.params;
    
    // Validate id is not empty
    if (!id) {
      return res.status(400).json({ error: 'Crawl ID is required' });
    }

    // Note: We don't validate as ObjectId because crawl IDs might be custom strings

    const status = await crawlerService.getCrawlStatus(id);

    if (!status) {
      return res.status(404).json({ error: 'Crawl job not found' });
    }

    return res.status(200).json(status);
  } catch (error) {
    logger.error(`Error getting crawl status for ${req.params.id}:`, error);
    
    // Check if it's a "not found" error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Crawl job not found' });
    }
    
    return res.status(500).json({ error: 'Failed to get crawl status' });
  }
}

/**
 * Get active crawls
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} - Array of active crawl jobs
 */
async function getActiveCrawls(req, res) {
  try {
    const activeCrawls = crawlerService.getActiveCrawls();

    return res.status(200).json(activeCrawls);
  } catch (error) {
    logger.error('Error getting active crawls:', error);
    return res.status(500).json({ error: 'Failed to get active crawls' });
  }
}

/**
 * Get crawl history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} - Array of completed crawl jobs
 */
async function getCrawlHistory(req, res) {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get crawl history from the database
    const history = await crawlerService.getCrawlHistory(
      parseInt(limit),
      skip
    );

    return res.status(200).json(history);
  } catch (error) {
    logger.error('Error getting crawl history:', error);
    return res.status(500).json({ error: 'Failed to get crawl history' });
  }
}

/**
 * Schedule a recurring crawl
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Scheduled crawl info
 */
async function scheduleRecurringCrawl(req, res) {
  try {
    const {
      source = 'all',
      searchParams = {},
      intervalMinutes = 60 * 24,
      name,
      schedule
    } = req.body;

    // Validate source
    if (source !== 'all' && !jobIntegrations.availableSources.includes(source)) {
      return res.status(400).json({
        error: `Invalid source. Available sources: ${jobIntegrations.availableSources.join(', ')} or 'all'`
      });
    }

    // Validate advanced schedule if provided
    if (schedule && schedule.type === 'advanced') {
      const { days, times } = schedule;

      // Validate days (0-6, where 0 is Sunday)
      if (!days || !Array.isArray(days) || days.length === 0) {
        return res.status(400).json({
          error: 'Advanced schedule must include at least one day (0-6, where 0 is Sunday)'
        });
      }

      // Check if days are valid
      if (!days.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
        return res.status(400).json({
          error: 'Days must be integers between 0 and 6 (0 is Sunday)'
        });
      }

      // Validate times (HH:MM format)
      if (!times || !Array.isArray(times) || times.length === 0) {
        return res.status(400).json({
          error: 'Advanced schedule must include at least one time in HH:MM format'
        });
      }

      // Check if times are valid
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!times.every(time => timeRegex.test(time))) {
        return res.status(400).json({
          error: 'Times must be in HH:MM format (24-hour)'
        });
      }
    }

    // Schedule crawl
    const scheduledCrawl = await crawlerService.scheduleRecurringCrawl({
      source,
      searchParams,
      intervalMinutes,
      name: name || `${source} Job Crawl`,
      schedule,
      userId: req.user.id
    });

    return res.status(200).json(scheduledCrawl);
  } catch (error) {
    logger.error('Error scheduling recurring crawl:', error);
    return res.status(500).json({ error: 'Failed to schedule recurring crawl' });
  }
}

/**
 * Cancel a scheduled crawl
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Result
 */
async function cancelScheduledCrawl(req, res) {
  try {
    const { id } = req.params;
    
    // Validate id is not empty
    if (!id) {
      return res.status(400).json({ error: 'Schedule ID is required' });
    }

    // Note: We don't validate as ObjectId because schedule IDs might be custom strings

    const result = await crawlerService.cancelScheduledCrawl(id);

    if (!result) {
      return res.status(404).json({ error: 'Scheduled crawl not found' });
    }

    return res.status(200).json({ success: true, message: 'Scheduled crawl cancelled successfully' });
  } catch (error) {
    logger.error(`Error cancelling scheduled crawl ${req.params.id}:`, error);
    
    // Check if it's a "not found" error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Scheduled crawl not found' });
    }
    
    return res.status(500).json({ error: 'Failed to cancel scheduled crawl' });
  }
}

/**
 * Get scheduled crawls
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Array} - Array of scheduled crawl jobs
 */
async function getScheduledCrawls(req, res) {
  try {
    const scheduledCrawls = crawlerService.getScheduledCrawls();

    return res.status(200).json(scheduledCrawls);
  } catch (error) {
    logger.error('Error getting scheduled crawls:', error);
    return res.status(500).json({ error: 'Failed to get scheduled crawls' });
  }
}

/**
 * Get crawl statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Crawl statistics
 */
async function getCrawlStats(req, res) {
  try {
    const stats = await crawlerService.getCrawlStats();
    return res.status(200).json(stats);
  } catch (error) {
    logger.error('Error getting crawl statistics:', error);
    return res.status(500).json({ error: 'Failed to get crawl statistics' });
  }
}

/**
 * Export crawl results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Export result
 */
async function exportCrawlResults(req, res) {
  try {
    const { format = 'csv', limit = 100 } = req.query;

    // Validate format
    if (!['csv', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Supported formats: csv, json, xml' });
    }

    // Get crawl history
    const crawlHistory = await CrawlJob.getCrawlHistory(parseInt(limit), 0);

    // Export data
    const result = await exportService.exportCrawlResults(crawlHistory, format);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error exporting crawl results:', error);
    return res.status(500).json({ error: 'Failed to export crawl results' });
  }
}

/**
 * Export crawl statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Export result
 */
async function exportCrawlStats(req, res) {
  try {
    const { format = 'csv' } = req.query;

    // Validate format
    if (!['csv', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Supported formats: csv, json, xml' });
    }

    // Get crawl statistics
    const stats = await CrawlJob.getCrawlStats();

    // Export data
    const result = await exportService.exportCrawlStats(stats, format);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error exporting crawl statistics:', error);
    return res.status(500).json({ error: 'Failed to export crawl statistics' });
  }
}

/**
 * Export jobs data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Export result
 */
async function exportJobs(req, res) {
  try {
    const { format = 'csv', limit = 1000, query = '{}' } = req.query;

    // Validate format
    if (!['csv', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Supported formats: csv, json, xml' });
    }

    // Parse query if provided
    let parsedQuery = {};
    try {
      parsedQuery = JSON.parse(query);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid query format. Must be valid JSON.' });
    }

    // Get jobs
    const jobs = await Job.find(parsedQuery).limit(parseInt(limit));

    // Export data
    const result = await exportService.exportJobs(jobs, format);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error exporting jobs data:', error);
    return res.status(500).json({ error: 'Failed to export jobs data' });
  }
}

module.exports = {
  getMatchedJobs,
  searchJobs,
  getJobById,
  getSimilarJobs,
  startCrawl,
  getCrawlStatus,
  getActiveCrawls,
  getCrawlHistory,
  scheduleRecurringCrawl,
  cancelScheduledCrawl,
  getScheduledCrawls,
  getCrawlStats,
  exportCrawlResults,
  exportCrawlStats,
  exportJobs
};
