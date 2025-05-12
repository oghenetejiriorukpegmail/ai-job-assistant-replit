/**
 * Job Board Integrations
 *
 * This module handles integration with various job board APIs.
 * It provides a unified interface for fetching jobs from different sources.
 */

const linkedinIntegration = require('./linkedin');
const indeedIntegration = require('./indeed');
const glassdoorIntegration = require('./glassdoor');
const googleJobsIntegration = require('./google-jobs');
const remotiveIntegration = require('./remotive');
const { Job } = require('../../models');
const deduplication = require('../utils/deduplication');
const logger = require('../../utils/logger');

// Map of available integrations
const integrations = {
  linkedin: linkedinIntegration,
  indeed: indeedIntegration,
  glassdoor: glassdoorIntegration,
  googleJobs: googleJobsIntegration,
  remotive: remotiveIntegration
};

/**
 * Fetch jobs from a specific source
 * @param {string} source - The job board source (linkedin, indeed, glassdoor, googleJobs)
 * @param {Object} options - Search options (keywords, location, etc.)
 * @returns {Promise<Array>} - Array of job objects
 */
async function fetchJobsFromSource(source, options = {}) {
  try {
    if (!integrations[source]) {
      throw new Error(`Integration for ${source} is not available`);
    }

    logger.info(`Fetching jobs from ${source} with options:`, options);
    const jobs = await integrations[source].fetchJobs(options);
    logger.info(`Fetched ${jobs.length} jobs from ${source}`);

    return jobs;
  } catch (error) {
    logger.error(`Error fetching jobs from ${source}:`, error);
    throw error;
  }
}

/**
 * Fetch jobs from all available sources
 * @param {Object} options - Search options (keywords, location, etc.)
 * @returns {Promise<Array>} - Array of job objects
 */
async function fetchJobsFromAllSources(options = {}) {
  const allJobs = [];
  const errors = [];

  // Execute all integrations in parallel
  const results = await Promise.allSettled(
    Object.keys(integrations).map(source => fetchJobsFromSource(source, options))
  );

  // Process results
  results.forEach((result, index) => {
    const source = Object.keys(integrations)[index];

    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    } else {
      errors.push({ source, error: result.reason });
      logger.error(`Failed to fetch jobs from ${source}:`, result.reason);
    }
  });

  if (errors.length > 0 && errors.length === Object.keys(integrations).length) {
    throw new Error('All job board integrations failed');
  }

  logger.info(`Fetched a total of ${allJobs.length} jobs from all sources`);
  return allJobs;
}

/**
 * Save fetched jobs to the database
 * @param {Array} jobs - Array of job objects
 * @returns {Promise<Object>} - Result object with counts
 */
async function saveJobs(jobs) {
  const result = {
    total: jobs.length,
    saved: 0,
    duplicates: 0,
    errors: 0
  };

  for (const job of jobs) {
    try {
      // Check for duplicates
      const isDuplicate = await deduplication.checkDuplicate(job);

      if (isDuplicate) {
        result.duplicates++;
        continue;
      }

      // Create new job
      const newJob = new Job({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        salary: job.salary,
        source: job.source,
        sourceId: job.sourceId,
        postedDate: job.postedDate,
        crawledDate: new Date(),
        isActive: true
      });

      await newJob.save();
      result.saved++;
    } catch (error) {
      logger.error('Error saving job:', error);
      result.errors++;
    }
  }

  return result;
}

/**
 * Fetch and save jobs from a specific source
 * @param {string} source - The job board source
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Result object
 */
async function fetchAndSaveJobs(source, options = {}) {
  const jobs = await fetchJobsFromSource(source, options);
  return await saveJobs(jobs);
}

/**
 * Fetch and save jobs from all available sources
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Result object
 */
async function fetchAndSaveAllJobs(options = {}) {
  const jobs = await fetchJobsFromAllSources(options);
  return await saveJobs(jobs);
}

module.exports = {
  fetchJobsFromSource,
  fetchJobsFromAllSources,
  saveJobs,
  fetchAndSaveJobs,
  fetchAndSaveAllJobs,
  availableSources: Object.keys(integrations)
};
