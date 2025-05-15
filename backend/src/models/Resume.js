/**
 * Resume model for MongoDB
 * Stores resume data including parsed structured information
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Experience schema for structured resume data
const ExperienceSchema = new Schema({
  title: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  description: {
    type: String
  }
});

// Education schema for structured resume data
const EducationSchema = new Schema({
  degree: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    trim: true
  }
});

// Structured resume data schema
const StructuredDataSchema = new Schema({
  skills: [String],
  experience: [ExperienceSchema],
  education: [EducationSchema]
});

// Main Resume schema
const ResumeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  rawText: {
    type: String
  },
  structured: StructuredDataSchema,
  provider: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
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

module.exports = mongoose.model('Resume', ResumeSchema);
