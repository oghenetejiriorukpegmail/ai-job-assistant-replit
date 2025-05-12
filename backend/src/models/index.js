/**
 * Export all models from a single file
 */

const User = require('./User');
const Resume = require('./Resume');
const Preference = require('./Preference');
const Job = require('./Job');
const Application = require('./Application');
const Setting = require('./Setting');
const CrawlJob = require('./CrawlJob');
const ScheduledCrawl = require('./ScheduledCrawl');

module.exports = {
  User,
  Resume,
  Preference,
  Job,
  Application,
  Setting,
  CrawlJob,
  ScheduledCrawl
};
