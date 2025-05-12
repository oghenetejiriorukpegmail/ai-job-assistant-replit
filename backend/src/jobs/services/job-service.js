/**
 * Job Service
 * 
 * This service handles job-related operations such as searching, filtering, and matching.
 */
const { Job } = require('../../models');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

/**
 * Search for jobs in the database
 * @param {Object} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(query = {}, options = {}) {
  try {
    const { 
      keywords, 
      location, 
      company, 
      source,
      isActive = true,
      minSalary,
      maxSalary,
      jobType,
      remote,
      skills = []
    } = query;
    
    const { 
      limit = 20, 
      skip = 0, 
      sort = { createdAt: -1 } 
    } = options;
    
    // Build MongoDB query
    const mongoQuery = { isActive };
    
    // Add text search if keywords provided
    if (keywords) {
      mongoQuery.$text = { $search: keywords };
    }
    
    // Add location filter
    if (location) {
      mongoQuery.location = { $regex: location, $options: 'i' };
    }
    
    // Add company filter
    if (company) {
      mongoQuery.company = { $regex: company, $options: 'i' };
    }
    
    // Add source filter
    if (source) {
      mongoQuery.source = source;
    }
    
    // Add salary filter
    if (minSalary || maxSalary) {
      mongoQuery.salary = {};
      if (minSalary) mongoQuery.salary.$gte = minSalary;
      if (maxSalary) mongoQuery.salary.$lte = maxSalary;
    }
    
    // Add job type filter
    if (jobType) {
      mongoQuery.jobType = jobType;
    }
    
    // Add remote filter
    if (remote !== undefined) {
      mongoQuery.remote = remote;
    }
    
    // Add skills filter
    if (skills.length > 0) {
      mongoQuery.skills = { $in: skills };
    }
    
    // Execute query
    const jobs = await Job.find(mongoQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Job.countDocuments(mongoQuery);
    
    return {
      jobs,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Error searching jobs:', error);
    throw error;
  }
}

/**
 * Get a job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Job object
 */
async function getJobById(jobId) {
  try {
    // Validate jobId
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    
    // Check if jobId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error(`Invalid job ID format: ${jobId}`);
    }
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    return job;
  } catch (error) {
    logger.error(`Error getting job by ID ${jobId}:`, error);
    throw error;
  }
}

/**
 * Get similar jobs based on a job ID
 * @param {string} jobId - Job ID
 * @param {number} limit - Maximum number of similar jobs to return
 * @returns {Promise<Array>} - Array of similar job objects
 */
async function getSimilarJobs(jobId, limit = 5) {
  try {
    // Validate jobId
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    
    // Check if jobId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error(`Invalid job ID format: ${jobId}`);
    }
    
    // Validate limit
    if (isNaN(limit) || limit <= 0) {
      throw new Error('Limit must be a positive number');
    }
    
    const job = await getJobById(jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    // Get jobs with similar title, company, or skills
    const similarJobs = await Job.find({
      _id: { $ne: jobId }, // Exclude the current job
      isActive: true,
      $or: [
        { title: { $regex: job.title.split(' ')[0], $options: 'i' } },
        { company: job.company },
        { skills: { $in: job.skills } }
      ]
    })
    .limit(limit);
    
    return similarJobs;
  } catch (error) {
    logger.error(`Error getting similar jobs for job ID ${jobId}:`, error);
    throw error;
  }
}

/**
 * Match jobs based on resume skills
 * @param {Array} skills - Array of skills from resume
 * @param {number} limit - Maximum number of jobs to return
 * @returns {Promise<Array>} - Array of matched job objects with scores
 */
async function matchJobsBySkills(skills, limit = 20) {
  try {
    if (!skills || skills.length === 0) {
      throw new Error('No skills provided for matching');
    }
    
    // Get all active jobs
    const jobs = await Job.find({ isActive: true });
    
    // Calculate match score for each job
    const scoredJobs = jobs.map(job => {
      // Extract skills from job description if not already present
      const jobSkills = job.skills.length > 0 ? job.skills : 
        extractSkillsFromText(job.description);
      
      // Count matching skills
      const matchingSkills = skills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(jobSkill.toLowerCase())
        )
      );
      
      // Calculate score (0-100)
      const score = jobSkills.length > 0 
        ? Math.round((matchingSkills.length / jobSkills.length) * 100)
        : 0;
      
      return {
        ...job.toObject(),
        score,
        matchingSkills
      };
    });
    
    // Sort by score (descending) and take top matches
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    logger.error('Error matching jobs by skills:', error);
    throw error;
  }
}

/**
 * Match jobs based on job titles
 * @param {Array} titles - Array of job titles
 * @param {number} limit - Maximum number of jobs to return
 * @returns {Promise<Array>} - Array of matched job objects
 */
async function matchJobsByTitles(titles, limit = 20) {
  try {
    if (!titles || titles.length === 0) {
      throw new Error('No job titles provided for matching');
    }
    
    // Create regex patterns for each title
    const patterns = titles.map(title => new RegExp(title, 'i'));
    
    // Find jobs matching any of the titles
    const jobs = await Job.find({
      isActive: true,
      title: { $in: patterns }
    })
    .limit(limit);
    
    return jobs;
  } catch (error) {
    logger.error('Error matching jobs by titles:', error);
    throw error;
  }
}

/**
 * Extract skills from text using simple keyword matching
 * @param {string} text - Text to extract skills from
 * @returns {Array} - Array of extracted skills
 */
function extractSkillsFromText(text) {
  // Common programming languages, frameworks, and technologies
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'SQL', 'NoSQL',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle', 'Redis', 'GraphQL', 'REST',
    'HTML', 'CSS', 'SASS', 'LESS', 'TypeScript', 'Webpack', 'Babel',
    'Machine Learning', 'AI', 'Data Science', 'Big Data', 'DevOps', 'CI/CD'
  ];
  
  // Extract skills from text
  return commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
}

module.exports = {
  searchJobs,
  getJobById,
  getSimilarJobs,
  matchJobsBySkills,
  matchJobsByTitles,
  extractSkillsFromText
};
