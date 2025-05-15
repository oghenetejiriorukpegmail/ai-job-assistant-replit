/**
 * Test script for job board integrations
 * 
 * This script tests the job board integrations by fetching jobs from each source.
 * It can be run directly with Node.js.
 */

require('dotenv').config();
const jobIntegrations = require('../jobs/integrations');
const logger = require('../utils/logger');

// Set log level to debug
logger.setLogLevel('DEBUG');

/**
 * Test a specific job board integration
 * @param {string} source - Job board source
 */
async function testIntegration(source) {
  logger.info(`Testing ${source} integration...`);
  
  try {
    // Check if integration is configured
    const integration = require(`../jobs/integrations/${source}`);
    const isConfigured = integration.isConfigured();
    
    logger.info(`${source} integration configured: ${isConfigured}`);
    
    if (!isConfigured) {
      logger.warn(`Skipping ${source} test as it's not configured.`);
      return;
    }
    
    // Test fetching jobs
    const options = {
      keywords: 'software engineer',
      location: 'remote',
      limit: 5
    };
    
    logger.info(`Fetching jobs from ${source} with options:`, options);
    const jobs = await jobIntegrations.fetchJobsFromSource(source, options);
    
    logger.info(`Fetched ${jobs.length} jobs from ${source}`);
    
    // Log first job details
    if (jobs.length > 0) {
      logger.info(`Sample job from ${source}:`, {
        title: jobs[0].title,
        company: jobs[0].company,
        location: jobs[0].location,
        url: jobs[0].url
      });
    }
    
    return jobs;
  } catch (error) {
    logger.error(`Error testing ${source} integration:`, error);
    return [];
  }
}

/**
 * Test all job board integrations
 */
async function testAllIntegrations() {
  logger.info('Testing all job board integrations...');
  
  const sources = ['linkedin', 'indeed', 'glassdoor', 'googleJobs'];
  const results = {};
  
  for (const source of sources) {
    results[source] = await testIntegration(source);
  }
  
  logger.info('Integration test results:', {
    linkedin: results.linkedin?.length || 0,
    indeed: results.indeed?.length || 0,
    glassdoor: results.glassdoor?.length || 0,
    googleJobs: results.googleJobs?.length || 0
  });
  
  // Test fetching from all sources
  try {
    logger.info('Testing fetchJobsFromAllSources...');
    
    const options = {
      keywords: 'software engineer',
      location: 'remote',
      limit: 5
    };
    
    const allJobs = await jobIntegrations.fetchJobsFromAllSources(options);
    
    logger.info(`Fetched ${allJobs.length} jobs from all sources`);
  } catch (error) {
    logger.error('Error testing fetchJobsFromAllSources:', error);
  }
}

// Run the tests
testAllIntegrations()
  .then(() => {
    logger.info('Integration tests completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Error running integration tests:', error);
    process.exit(1);
  });
