/**
 * ScheduledCrawl Model
 *
 * Stores information about scheduled recurring job crawls.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ScheduledCrawlSchema = new Schema({
  scheduleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['linkedin', 'indeed', 'glassdoor', 'googleJobs', 'remotive', 'all'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  searchParams: {
    keywords: String,
    location: String,
    limit: Number,
    jobType: String,
    remote: Boolean
  },
  intervalMinutes: {
    type: Number,
    required: true,
    min: 15 // Minimum 15 minutes between crawls
  },
  schedule: {
    type: Object,
    default: null,
    // Can contain:
    // - type: 'simple' (just interval) or 'advanced' (specific days/times)
    // - days: Array of days (0-6, where 0 is Sunday)
    // - times: Array of times in 24h format (e.g., ['09:00', '18:00'])
    // - timezone: String (e.g., 'America/New_York')
  },
  lastRunTime: {
    type: Date
  },
  nextRunTime: {
    type: Date,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  crawlHistory: [{
    crawlJobId: {
      type: Schema.Types.ObjectId,
      ref: 'CrawlJob'
    },
    startTime: Date,
    endTime: Date,
    status: String,
    result: {
      total: Number,
      saved: Number,
      duplicates: Number,
      errors: Number
    }
  }]
}, {
  timestamps: true
});

// Create indexes for common queries
ScheduledCrawlSchema.index({ status: 1 });
ScheduledCrawlSchema.index({ nextRunTime: 1 });
ScheduledCrawlSchema.index({ createdBy: 1 });

// Method to update next run time
ScheduledCrawlSchema.methods.updateNextRunTime = function() {
  const now = new Date();
  this.lastRunTime = now;

  // If using advanced scheduling
  if (this.schedule && this.schedule.type === 'advanced') {
    this.nextRunTime = calculateNextRunTimeAdvanced(now, this.schedule);
  } else {
    // Simple interval-based scheduling
    this.nextRunTime = new Date(now.getTime() + this.intervalMinutes * 60 * 1000);
  }

  return this.save();
};

/**
 * Calculate next run time for advanced scheduling
 * @param {Date} now - Current date
 * @param {Object} schedule - Schedule configuration
 * @returns {Date} - Next run time
 */
function calculateNextRunTimeAdvanced(now, schedule) {
  const { days, times, timezone } = schedule;

  // Default to UTC if no timezone specified
  const tz = timezone || 'UTC';

  // Convert to target timezone
  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));

  // If no days or times specified, fall back to simple scheduling
  if (!days || !days.length || !times || !times.length) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }

  // Get current day of week (0-6, where 0 is Sunday)
  const currentDay = nowInTz.getDay();

  // Find the next allowed day
  let nextDay = null;
  let daysToAdd = 0;

  // Sort days to ensure they're in ascending order
  const sortedDays = [...days].sort((a, b) => a - b);

  // Find the next day that's allowed in the schedule
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (sortedDays.includes(checkDay)) {
      nextDay = checkDay;
      daysToAdd = i;

      // If it's the current day, check if we've passed all scheduled times
      if (i === 0) {
        const currentHour = nowInTz.getHours();
        const currentMinute = nowInTz.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Sort times to ensure they're in ascending order
        const sortedTimes = [...times].sort();

        // Check if there's a time later today
        const laterTime = sortedTimes.find(time => time > currentTime);

        if (laterTime) {
          // There's a time later today, use it
          const [hours, minutes] = laterTime.split(':').map(Number);
          const result = new Date(nowInTz);
          result.setHours(hours, minutes, 0, 0);
          return result;
        } else {
          // No time later today, move to next allowed day
          continue;
        }
      }

      break;
    }
  }

  // If no next day found, use the first day in the cycle (wrap around)
  if (nextDay === null) {
    nextDay = sortedDays[0];
    daysToAdd = (nextDay + 7 - currentDay) % 7;
  }

  // Create a new date for the next day
  const nextDate = new Date(nowInTz);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  // Use the first time for that day
  const sortedTimes = [...times].sort();
  const [hours, minutes] = sortedTimes[0].split(':').map(Number);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
};

// Method to add crawl to history
ScheduledCrawlSchema.methods.addCrawlToHistory = function(crawlJob) {
  this.crawlHistory.push({
    crawlJobId: crawlJob._id,
    startTime: crawlJob.startTime,
    endTime: crawlJob.endTime,
    status: crawlJob.status,
    result: crawlJob.result
  });

  // Keep only the last 10 crawls in history
  if (this.crawlHistory.length > 10) {
    this.crawlHistory = this.crawlHistory.slice(-10);
  }

  return this.save();
};

// Static method to get due schedules
ScheduledCrawlSchema.statics.getDueSchedules = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    nextRunTime: { $lte: now }
  });
};

// Static method to get all active schedules
ScheduledCrawlSchema.statics.getActiveSchedules = function() {
  return this.find({
    status: 'active'
  }).sort({ nextRunTime: 1 });
};

const ScheduledCrawl = mongoose.model('ScheduledCrawl', ScheduledCrawlSchema);

module.exports = ScheduledCrawl;
