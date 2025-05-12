/**
 * Preference model for MongoDB
 * Stores user job matching preferences
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['resume', 'titles'],
    default: 'resume'
  },
  jobTitles: {
    type: [String],
    default: []
  },
  locations: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    default: ''
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

module.exports = mongoose.model('Preference', PreferenceSchema);
