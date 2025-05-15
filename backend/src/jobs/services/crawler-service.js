/**
 * Crawler Service
 *
 * This service handles job crawling operations, including scheduling and executing crawls.
 */

const jobIntegrations = require('../integrations');
const logger = require('../../utils/logger');
const { CrawlJob, ScheduledCrawl, User } = require('../../models');
const mongoose = require('mongoose');
const emailService = require('../../services/email-service');

// Store for active crawl jobs
const activeCrawls = new Map();

/**
 * Start a job crawl
 * @param {Object} options - Crawl options
 * @param {string} options.source - Job board source (or 'all' for all sources)
 * @param {Object} options.searchParams - Search parameters for the job board
 * @param {boolean} options.saveJobs - Whether to save jobs to the database
 * @param {string} options.userId - ID of the user starting the crawl
 * @param {string} options.scheduleId - ID of the schedule if this is a scheduled crawl
 * @returns {Promise<Object>} - Crawl result
 */
async function startCrawl(options = {}) {
  const {
    source = 'all',
    searchParams = {},
    saveJobs = true,
    userId = null,
    scheduleId = null
  } = options;

  const crawlId = `crawl-${Date.now()}`;

  try {
    logger.info(`Starting job crawl ${crawlId} for source: ${source}`);

    // Create crawl job in database
    const crawlJob = new CrawlJob({
      jobId: crawlId,
      source,
      searchParams,
      startTime: new Date(),
      status: 'running',
      createdBy: userId ? mongoose.Types.ObjectId(userId) : null,
      isScheduled: !!scheduleId,
      scheduleId
    });

    // Save to database
    await crawlJob.save();

    // Also store in memory for quick access
    activeCrawls.set(crawlId, {
      id: crawlId,
      source,
      searchParams,
      startTime: crawlJob.startTime,
      status: 'running',
      result: null,
      error: null
    });

    // Execute crawl
    let result;

    if (source === 'all') {
      result = await jobIntegrations.fetchJobsFromAllSources(searchParams);
    } else {
      result = await jobIntegrations.fetchJobsFromSource(source, searchParams);
    }

    // Save jobs if requested
    let saveResult;
    if (saveJobs && result.length > 0) {
      saveResult = await jobIntegrations.saveJobs(result);
    } else {
      saveResult = { total: result.length, saved: 0, duplicates: 0, errors: 0 };
    }

    // Update in-memory crawl job
    const memCrawlJob = activeCrawls.get(crawlId);
    if (memCrawlJob) {
      memCrawlJob.status = 'completed';
      memCrawlJob.result = saveResult;
      memCrawlJob.endTime = new Date();
    }

    // Update database crawl job
    crawlJob.status = 'completed';
    crawlJob.endTime = new Date();
    crawlJob.result = saveResult;
    await crawlJob.save();

    // If this is a scheduled crawl, update the schedule
    if (scheduleId) {
      try {
        const schedule = await ScheduledCrawl.findOne({ scheduleId });
        if (schedule) {
          await schedule.updateNextRunTime();
          await schedule.addCrawlToHistory(crawlJob);
        }
      } catch (scheduleError) {
        logger.error(`Error updating schedule for crawl ${crawlId}:`, scheduleError);
      }
    }

    // Send email notification if user exists
    if (userId && emailService.isConfigured()) {
      try {
        const user = await User.findById(userId);
        if (user && user.email && user.notifications?.jobCrawlCompletion !== false) {
          await emailService.sendCrawlCompletionNotification(user, crawlJob);
        }
      } catch (emailError) {
        logger.error(`Error sending email notification for crawl ${crawlId}:`, emailError);
      }
    }

    logger.info(`Job crawl ${crawlId} completed successfully`);
    return {
      id: crawlId,
      source,
      status: 'completed',
      startTime: crawlJob.startTime,
      endTime: crawlJob.endTime,
      result: saveResult
    };
  } catch (error) {
    logger.error(`Error in job crawl ${crawlId}:`, error);

    // Update in-memory crawl job with error
    const memCrawlJob = activeCrawls.get(crawlId);
    if (memCrawlJob) {
      memCrawlJob.status = 'failed';
      memCrawlJob.error = error.message;
      memCrawlJob.endTime = new Date();
    }

    // Update database crawl job with error
    try {
      const dbCrawlJob = await CrawlJob.findOne({ jobId: crawlId });
      if (dbCrawlJob) {
        dbCrawlJob.status = 'failed';
        dbCrawlJob.endTime = new Date();
        dbCrawlJob.error = {
          message: error.message,
          stack: error.stack
        };
        await dbCrawlJob.save();

        // Send email notification for failed crawl
        if (userId && emailService.isConfigured()) {
          try {
            const user = await User.findById(userId);
            if (user && user.email && user.notifications?.jobCrawlCompletion !== false) {
              await emailService.sendCrawlCompletionNotification(user, dbCrawlJob);
            }
          } catch (emailError) {
            logger.error(`Error sending email notification for failed crawl ${crawlId}:`, emailError);
          }
        }
      }
    } catch (dbError) {
      logger.error(`Error updating crawl job ${crawlId} in database:`, dbError);
    }

    throw error;
  }
}

/**
 * Get the status of a crawl
 * @param {string} crawlId - Crawl ID
 * @returns {Promise<Object>} - Crawl status
 */
async function getCrawlStatus(crawlId) {
  try {
    if (!crawlId) {
      throw new Error('Crawl ID is required');
    }

    // First try to get from memory for quick access
    const memCrawlJob = activeCrawls.get(crawlId);

    if (memCrawlJob) {
      return {
        id: memCrawlJob.id,
        source: memCrawlJob.source,
        status: memCrawlJob.status,
        startTime: memCrawlJob.startTime,
        endTime: memCrawlJob.endTime,
        result: memCrawlJob.result,
        error: memCrawlJob.error
      };
    }

    // If not in memory, try to get from database
    const dbCrawlJob = await CrawlJob.findOne({ jobId: crawlId });

    if (!dbCrawlJob) {
      throw new Error(`Crawl job ${crawlId} not found`);
    }

    return {
      id: dbCrawlJob.jobId,
      source: dbCrawlJob.source,
      status: dbCrawlJob.status,
      startTime: dbCrawlJob.startTime,
      endTime: dbCrawlJob.endTime,
      result: dbCrawlJob.result,
      error: dbCrawlJob.error ? dbCrawlJob.error.message : null
    };
  } catch (error) {
    logger.error(`Error in getCrawlStatus for crawl ID ${crawlId}:`, error);
    throw error;
  }
}

/**
 * Get all active crawls
 * @returns {Promise<Array>} - Array of active crawl jobs
 */
async function getActiveCrawls() {
  // Get active crawls from memory
  const memActiveCrawls = Array.from(activeCrawls.values())
    .filter(crawlJob => crawlJob.status === 'running')
    .map(crawlJob => ({
      id: crawlJob.id,
      source: crawlJob.source,
      status: crawlJob.status,
      startTime: crawlJob.startTime,
      endTime: crawlJob.endTime
    }));

  // Get active crawls from database
  const dbActiveCrawls = await CrawlJob.getActiveCrawls();

  // Convert database crawls to the same format
  const formattedDbCrawls = dbActiveCrawls.map(crawlJob => ({
    id: crawlJob.jobId,
    source: crawlJob.source,
    status: crawlJob.status,
    startTime: crawlJob.startTime,
    endTime: crawlJob.endTime
  }));

  // Combine both sources, removing duplicates
  const allCrawls = [...memActiveCrawls];

  // Add database crawls that aren't already in memory
  for (const dbCrawl of formattedDbCrawls) {
    if (!allCrawls.some(memCrawl => memCrawl.id === dbCrawl.id)) {
      allCrawls.push(dbCrawl);
    }
  }

  return allCrawls;
}

/**
 * Schedule a recurring crawl
 * @param {Object} options - Crawl options
 * @param {string} options.source - Job board source
 * @param {Object} options.searchParams - Search parameters
 * @param {number} options.intervalMinutes - Interval in minutes
 * @param {string} options.userId - ID of the user creating the schedule
 * @param {string} options.name - Optional name for the schedule
 * @param {Object} options.schedule - Advanced scheduling options
 * @returns {Promise<Object>} - Scheduled crawl info
 */
async function scheduleRecurringCrawl(options = {}) {
  const {
    source = 'all',
    searchParams = {},
    intervalMinutes = 60 * 24, // Default: once a day
    userId = null,
    name = `${source} Job Crawl`,
    schedule = null
  } = options;

  const scheduleId = `schedule-${Date.now()}`;
  const nextRunTime = new Date(Date.now() + 1000); // Start in 1 second

  try {
    // Create scheduled job in database
    const scheduledCrawl = new ScheduledCrawl({
      scheduleId,
      name,
      source,
      searchParams,
      intervalMinutes,
      schedule,
      nextRunTime: schedule && schedule.type === 'advanced'
        ? calculateNextRunTime(schedule)
        : nextRunTime,
      status: 'active',
      createdBy: userId ? mongoose.Types.ObjectId(userId) : null
    });

    /**
     * Calculate the next run time based on advanced schedule
     * @param {Object} schedule - Schedule configuration
     * @returns {Date} - Next run time
     */
    function calculateNextRunTime(schedule) {
      // This is just a placeholder - the actual calculation is done in the model
      // We're just ensuring the nextRunTime is calculated correctly on creation
      const now = new Date();

      // If no valid schedule, use simple interval
      if (!schedule || !schedule.type || schedule.type !== 'advanced') {
        return new Date(now.getTime() + intervalMinutes * 60 * 1000);
      }

      const { days, times, timezone } = schedule;

      // If no days or times, use simple interval
      if (!days || !days.length || !times || !times.length) {
        return new Date(now.getTime() + intervalMinutes * 60 * 1000);
      }

      // Default to UTC if no timezone specified
      const tz = timezone || 'UTC';

      // Convert to target timezone
      const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));

      // Get current day of week (0-6, where 0 is Sunday)
      const currentDay = nowInTz.getDay();

      // Sort days and times
      const sortedDays = [...days].sort((a, b) => a - b);
      const sortedTimes = [...times].sort();

      // Current time in HH:MM format
      const currentHour = nowInTz.getHours();
      const currentMinute = nowInTz.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // Check if today is in the schedule and there's a time later today
      if (sortedDays.includes(currentDay)) {
        const laterTime = sortedTimes.find(time => time > currentTime);

        if (laterTime) {
          // There's a time later today, use it
          const [hours, minutes] = laterTime.split(':').map(Number);
          const result = new Date(nowInTz);
          result.setHours(hours, minutes, 0, 0);
          return result;
        }
      }

      // Find the next day in the schedule
      let nextDay = null;
      let daysToAdd = 0;

      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (sortedDays.includes(checkDay)) {
          nextDay = checkDay;
          daysToAdd = i;
          break;
        }
      }

      // If no next day found, use the first day in the cycle
      if (nextDay === null) {
        nextDay = sortedDays[0];
        daysToAdd = (nextDay + 7 - currentDay) % 7;
      }

      // Create a new date for the next day
      const nextDate = new Date(nowInTz);
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      // Use the first time for that day
      const [hours, minutes] = sortedTimes[0].split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);

      return nextDate;
    }

    // Save to database
    await scheduledCrawl.save();

    // Create in-memory scheduled job for immediate execution
    const scheduledJob = {
      id: scheduleId,
      source,
      searchParams,
      intervalMinutes,
      lastRun: null,
      nextRun: nextRunTime,
      intervalId: null,
      status: 'active'
    };

    // Set up interval
    scheduledJob.intervalId = setInterval(async () => {
      try {
        // Check if schedule still exists and is active
        const schedule = await ScheduledCrawl.findOne({
          scheduleId,
          status: 'active'
        });

        if (!schedule) {
          // Schedule was cancelled or doesn't exist anymore
          clearInterval(scheduledJob.intervalId);
          scheduledCrawls.delete(scheduleId);
          return;
        }

        // Check if it's time to run
        const now = new Date();
        if (schedule.nextRunTime > now) {
          // Not time yet
          return;
        }

        logger.info(`Running scheduled crawl ${scheduleId} for source: ${source}`);

        // Execute crawl
        await startCrawl({
          source,
          searchParams,
          saveJobs: true,
          scheduleId
        });

        // Schedule will be updated by the startCrawl function
        logger.info(`Scheduled crawl ${scheduleId} completed successfully`);
      } catch (error) {
        logger.error(`Error in scheduled crawl ${scheduleId}:`, error);
      }
    }, Math.min(intervalMinutes * 60 * 1000, 60 * 60 * 1000)); // Check at least every hour

    // Store scheduled job in memory
    scheduledCrawls.set(scheduleId, scheduledJob);

    // Run immediately
    startCrawl({
      source,
      searchParams,
      saveJobs: true,
      scheduleId,
      userId
    }).catch(error => {
      logger.error(`Error in initial scheduled crawl ${scheduleId}:`, error);
    });

    return {
      id: scheduleId,
      name,
      source,
      intervalMinutes,
      schedule: schedule,
      nextRun: scheduledCrawl.nextRunTime
    };
  } catch (error) {
    logger.error(`Error scheduling recurring crawl:`, error);
    throw error;
  }
}

// Store for scheduled crawl jobs
const scheduledCrawls = new Map();

/**
 * Cancel a scheduled crawl
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<boolean>} - True if cancelled successfully
 */
async function cancelScheduledCrawl(scheduleId) {
  try {
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }

    let cancelled = false;

    // First try to cancel in-memory scheduled job
    const scheduledJob = scheduledCrawls.get(scheduleId);

    if (scheduledJob) {
      // Clear interval
      clearInterval(scheduledJob.intervalId);

      // Remove from store
      scheduledCrawls.delete(scheduleId);
      cancelled = true;
    }

    // Update in database
    const scheduledCrawl = await ScheduledCrawl.findOne({ scheduleId });

    if (!scheduledCrawl) {
      // If we cancelled an in-memory job but couldn't find it in the database,
      // we still consider it a success
      if (cancelled) {
        logger.warn(`Scheduled crawl ${scheduleId} was in memory but not found in database`);
        return true;
      }
      throw new Error(`Scheduled crawl ${scheduleId} not found`);
    }

    // Update status
    scheduledCrawl.status = 'cancelled';
    await scheduledCrawl.save();

    return true;
  } catch (error) {
    logger.error(`Error in cancelScheduledCrawl for schedule ID ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Get all scheduled crawls
 * @returns {Promise<Array>} - Array of scheduled crawl jobs
 */
async function getScheduledCrawls() {
  // Get scheduled crawls from database
  const dbScheduledCrawls = await ScheduledCrawl.find({
    status: { $in: ['active', 'paused'] }
  }).sort({ nextRunTime: 1 });

  // Convert to standard format
  return dbScheduledCrawls.map(schedule => ({
    id: schedule.scheduleId,
    name: schedule.name,
    source: schedule.source,
    status: schedule.status,
    intervalMinutes: schedule.intervalMinutes,
    lastRun: schedule.lastRunTime,
    nextRun: schedule.nextRunTime,
    createdAt: schedule.createdAt
  }));
}

/**
 * Get crawl history
 * @param {number} limit - Maximum number of results
 * @param {number} skip - Number of results to skip
 * @returns {Promise<Array>} - Array of completed crawl jobs
 */
async function getCrawlHistory(limit = 10, skip = 0) {
  // Get crawl history from database
  const dbCrawlHistory = await CrawlJob.getCrawlHistory(limit, skip);

  // Convert to standard format
  return dbCrawlHistory.map(crawl => ({
    id: crawl.jobId,
    source: crawl.source,
    status: crawl.status,
    startTime: crawl.startTime,
    endTime: crawl.endTime,
    result: crawl.result,
    error: crawl.error ? crawl.error.message : null,
    duration: crawl.duration
  }));
}

/**
 * Get crawl statistics
 * @returns {Promise<Object>} - Crawl statistics
 */
async function getCrawlStats() {
  return await CrawlJob.getCrawlStats();
}

module.exports = {
  startCrawl,
  getCrawlStatus,
  getActiveCrawls,
  scheduleRecurringCrawl,
  cancelScheduledCrawl,
  getScheduledCrawls,
  getCrawlHistory,
  getCrawlStats
};
