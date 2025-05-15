/**
 * Models index file
 * 
 * This file exports all database models using the appropriate database adapter.
 * It works with any of our supported database backends (Replit DB, MongoDB, in-memory).
 */

const { getCollection } = require('../config/database');

// Collection/model names
const COLLECTIONS = {
  USERS: 'users',
  RESUMES: 'resumes',
  PREFERENCES: 'preferences',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  SETTINGS: 'settings',
  CRAWL_JOBS: 'crawlJobs',
  SCHEDULED_CRAWLS: 'scheduledCrawls'
};

// Export models as getters
module.exports = {
  // Collection names
  COLLECTIONS,
  
  // Model getters
  get User() { return getCollection(COLLECTIONS.USERS); },
  get Resume() { return getCollection(COLLECTIONS.RESUMES); },
  get Preference() { return getCollection(COLLECTIONS.PREFERENCES); },
  get Job() { return getCollection(COLLECTIONS.JOBS); },
  get Application() { return getCollection(COLLECTIONS.APPLICATIONS); },
  get Setting() { return getCollection(COLLECTIONS.SETTINGS); },
  get CrawlJob() { return getCollection(COLLECTIONS.CRAWL_JOBS); },
  get ScheduledCrawl() { return getCollection(COLLECTIONS.SCHEDULED_CRAWLS); }
};
