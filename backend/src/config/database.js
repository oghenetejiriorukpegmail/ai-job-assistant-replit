/**
 * MongoDB database connection configuration
 * Establishes connection to MongoDB using Mongoose
 * Provides fallback to in-memory storage when MongoDB is unavailable
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true, debug: true });

if (dotenvResult.error) {
  console.error('[DEBUG] dotenv error:', dotenvResult.error);
} else {
  console.log('[DEBUG] dotenv parsed:', dotenvResult.parsed);
}

// Get MongoDB URI from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-saas';
console.log(`[DEBUG] MONGODB_URI is (after dotenv): ${MONGODB_URI}`); // Updated debug log

// Flag to track if we're using in-memory fallback
let usingFallback = false;

// In-memory data store for fallback
const inMemoryStore = {
  users: [],
  resumes: [],
  settings: [],
  preferences: [],
  jobs: [],
  applications: []
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Try to connect without authentication first (for local development)
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    usingFallback = false;
    return conn;
  } catch (error) {
    console.warn(`Warning: Could not connect to MongoDB: ${error.message}`);

    // If authentication is required, try to connect with default credentials
    if (error.message.includes('Authentication failed') ||
        error.message.includes('not authorized')) {
      try {
        console.log('Trying to connect with default credentials...');
        const authUri = MONGODB_URI.replace('mongodb://', 'mongodb://admin:password@');
        const conn = await mongoose.connect(authUri, {
          serverSelectionTimeoutMS: 5000,
        });

        console.log(`MongoDB Connected with default credentials: ${conn.connection.host}`);
        usingFallback = false;
        return conn;
      } catch (authError) {
        console.warn(`Authentication with default credentials failed: ${authError.message}`);
      }
    }

    console.warn('Falling back to in-memory storage. Data will not persist after server restart.');
    usingFallback = true;
    return null;
  }
};

// Check if using fallback
const isUsingFallback = () => usingFallback;

// Get in-memory store
const getInMemoryStore = () => inMemoryStore;

module.exports = {
  connectDB,
  isUsingFallback,
  getInMemoryStore
};
