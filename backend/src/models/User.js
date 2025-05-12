/**
 * User model for MongoDB
 * Stores user account information and profile data
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String
  },
  jobTitle: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  roles: {
    type: [String],
    enum: ['user', 'admin'],
    default: ['user']
  },
  notifications: {
    type: Object,
    default: {
      jobCrawlCompletion: true,
      newJobMatches: true,
      applicationUpdates: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
