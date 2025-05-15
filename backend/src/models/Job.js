/**
 * Job model for MongoDB
 * Stores job listings and related information
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  salary: {
    type: String,
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    default: 'full-time'
  },
  url: {
    type: String,
    trim: true
  },
  normalizedUrl: {
    type: String,
    trim: true
  },
  applicationUrl: {
    type: String,
    trim: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['linkedin', 'indeed', 'glassdoor', 'google', 'googleJobs', 'remotive', 'manual', 'other'],
    default: 'manual'
  },
  sourceId: {
    type: String,
    trim: true
  },
  fingerprint: {
    type: String,
    trim: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create text index for searching
JobSchema.index(
  { title: 'text', company: 'text', description: 'text', skills: 'text' },
  { weights: { title: 10, company: 5, skills: 3, description: 1 } }
);

// Create indexes for common queries
JobSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });
JobSchema.index({ normalizedUrl: 1 }, { unique: true, sparse: true });
JobSchema.index({ fingerprint: 1 }, { unique: true, sparse: true });
JobSchema.index({ isActive: 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ location: 1 });
JobSchema.index({ company: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ remote: 1 });

// Pre-save hook to generate fingerprint and normalize URL
JobSchema.pre('save', function(next) {
  // Generate fingerprint if not already set
  if (!this.fingerprint) {
    const company = (this.company || '').toLowerCase().trim();
    const title = (this.title || '').toLowerCase().trim();
    const location = (this.location || '').toLowerCase().trim();
    this.fingerprint = `${company}|${title}|${location}`;
  }

  // Normalize URL if not already set
  if (this.url && !this.normalizedUrl) {
    try {
      // Remove query parameters and hash
      const urlObj = new URL(this.url);
      urlObj.search = '';
      urlObj.hash = '';

      // Remove trailing slash
      let normalized = urlObj.toString();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }

      this.normalizedUrl = normalized.toLowerCase();
    } catch (error) {
      // If URL parsing fails, just use the original URL
      this.normalizedUrl = this.url.toLowerCase();
    }
  }

  next();
});

module.exports = mongoose.model('Job', JobSchema);
