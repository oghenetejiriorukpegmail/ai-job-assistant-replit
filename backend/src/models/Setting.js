/**
 * Setting model for MongoDB
 * Stores user-specific application settings
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['openai', 'google', 'gemini-2.0-flash', 'openrouter', 'anthropic', 'mistral'],
    default: 'google'
  },
  model: {
    type: String,
    default: 'gemini-2.5-pro-exp-03-25'
  },
  apiKeys: {
    openai: {
      type: String,
      default: ''
    },
    gemini: {
      type: String,
      default: ''
    },
    openrouter: {
      type: String,
      default: ''
    },
    anthropic: {
      type: String,
      default: ''
    },
    mistral: {
      type: String,
      default: ''
    }
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

module.exports = mongoose.model('Setting', SettingSchema);
