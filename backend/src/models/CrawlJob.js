/**
 * CrawlJob Model
 *
 * Stores information about job crawl operations.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CrawlJobSchema = new Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  source: {
    type: String,
    enum: ['linkedin', 'indeed', 'glassdoor', 'googleJobs', 'remotive', 'all'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  searchParams: {
    keywords: String,
    location: String,
    limit: Number,
    jobType: String,
    remote: Boolean
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },
  result: {
    total: Number,
    saved: Number,
    duplicates: Number,
    errors: Number
  },
  error: {
    message: String,
    stack: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleId: {
    type: String,
    sparse: true,
    index: true
  },
  scheduleInterval: {
    type: Number // in minutes
  },
  nextRunTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for common queries
CrawlJobSchema.index({ status: 1 });
CrawlJobSchema.index({ source: 1 });
CrawlJobSchema.index({ startTime: -1 });
CrawlJobSchema.index({ isScheduled: 1 });
CrawlJobSchema.index({ createdBy: 1 });

// Pre-save hook to calculate duration
CrawlJobSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  next();
});

// Static method to get active crawls
CrawlJobSchema.statics.getActiveCrawls = function() {
  return this.find({
    status: 'running',
    isScheduled: false
  }).sort({ startTime: -1 });
};

// Static method to get scheduled crawls
CrawlJobSchema.statics.getScheduledCrawls = function() {
  return this.find({
    isScheduled: true
  }).sort({ nextRunTime: 1 });
};

// Static method to get crawl history
CrawlJobSchema.statics.getCrawlHistory = function(limit = 10, skip = 0) {
  return this.find({
    status: { $in: ['completed', 'failed', 'cancelled'] },
    isScheduled: false
  })
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get crawl statistics
CrawlJobSchema.statics.getCrawlStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$source',
        totalJobs: { $sum: '$result.total' },
        savedJobs: { $sum: '$result.saved' },
        duplicateJobs: { $sum: '$result.duplicates' },
        errorJobs: { $sum: '$result.errors' },
        avgDuration: { $avg: '$duration' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalStats = await this.aggregate([
    {
      $match: {
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: '$result.total' },
        savedJobs: { $sum: '$result.saved' },
        duplicateJobs: { $sum: '$result.duplicates' },
        errorJobs: { $sum: '$result.errors' },
        avgDuration: { $avg: '$duration' },
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    bySource: stats,
    total: totalStats[0] || {
      totalJobs: 0,
      savedJobs: 0,
      duplicateJobs: 0,
      errorJobs: 0,
      avgDuration: 0,
      count: 0
    }
  };
};

const CrawlJob = mongoose.model('CrawlJob', CrawlJobSchema);

module.exports = CrawlJob;
