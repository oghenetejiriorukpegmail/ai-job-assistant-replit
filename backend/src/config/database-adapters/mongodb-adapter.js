/**
 * MongoDB Adapter
 * 
 * This module provides a standard interface for MongoDB operations.
 * It's used when running outside of Replit environment.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), override: true });

// Get MongoDB URI from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-saas';

class MongoDBAdapter {
  constructor() {
    this.connected = false;
    this.connection = null;
  }

  async connect() {
    try {
      // Try to connect without authentication first (for local development)
      this.connection = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      });

      console.log(`MongoDB Connected: ${this.connection.connection.host}`);
      this.connected = true;
      return true;
    } catch (error) {
      console.warn(`Warning: Could not connect to MongoDB: ${error.message}`);

      // If authentication is required, try to connect with default credentials
      if (error.message.includes('Authentication failed') ||
          error.message.includes('not authorized')) {
        try {
          console.log('Trying to connect with default credentials...');
          const authUri = MONGODB_URI.replace('mongodb://', 'mongodb://admin:password@');
          this.connection = await mongoose.connect(authUri, {
            serverSelectionTimeoutMS: 5000,
          });

          console.log(`MongoDB Connected with default credentials: ${this.connection.connection.host}`);
          this.connected = true;
          return true;
        } catch (authError) {
          console.warn(`Authentication with default credentials failed: ${authError.message}`);
        }
      }

      console.warn('MongoDB connection failed.');
      return false;
    }
  }

  /**
   * Get a collection from MongoDB
   * @param {string} collectionName - Name of the collection
   * @returns {Object} - Mongoose model for the collection
   */
  collection(collectionName) {
    if (!this.connected) {
      throw new Error('Not connected to MongoDB');
    }

    // Use the existing mongoose model or create a generic one
    if (mongoose.models[collectionName]) {
      return mongoose.model(collectionName);
    } else {
      // Create a generic schema for this collection
      const schema = new mongoose.Schema({}, { 
        strict: false, 
        timestamps: true,
        collection: collectionName
      });
      return mongoose.model(collectionName, schema);
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = new MongoDBAdapter();
