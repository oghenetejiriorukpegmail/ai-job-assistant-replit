/**
 * Application model for MongoDB
 * Stores job applications submitted by users
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resumeId: {
    type: Schema.Types.ObjectId,
    ref: 'Resume'
  },
  coverLetter: {
    type: String
  },
  status: {
    type: String,
    enum: ['applied', 'in-review', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  notes: {
    type: String
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
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

module.exports = mongoose.model('Application', ApplicationSchema);
