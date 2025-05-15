/**
 * Database Configuration
 * 
 * This module provides a unified interface for database operations
 * with support for different database backends:
 * - Replit Database (when running on Replit)
 * - MongoDB (when running outside Replit with MongoDB available)
 * - In-memory (fallback when neither Replit Database nor MongoDB are available)
 */

// Check if running on Replit
const isReplit = typeof process !== 'undefined' && process.env.REPL_ID !== undefined;

// Database adapters
const replitAdapter = require('./database-adapters/replit-adapter');
const mongodbAdapter = require('./database-adapters/mongodb-adapter');
const memoryAdapter = require('./database-adapters/memory-adapter');

// Database mode flags
let usingReplitDB = false;
let usingMongoDB = false;
let usingMemory = false;

// The active database adapter
let activeAdapter = null;

/**
 * Connect to the appropriate database based on environment
 * @returns {Promise<boolean>} - True if connected successfully
 */
const connectDB = async () => {
  console.log(`[DEBUG] Running in ${isReplit ? 'Replit' : 'local'} environment`);
  
  // Try Replit Database first if on Replit
  if (isReplit) {
    console.log('Attempting to connect to Replit Database...');
    const connected = await replitAdapter.connect();
    if (connected) {
      activeAdapter = replitAdapter;
      usingReplitDB = true;
      return true;
    }
  }
  
  // Try MongoDB if not on Replit or Replit Database failed
  console.log('Attempting to connect to MongoDB...');
  const connected = await mongodbAdapter.connect();
  if (connected) {
    activeAdapter = mongodbAdapter;
    usingMongoDB = true;
    return true;
  }
  
  // Fall back to in-memory database
  console.log('Falling back to in-memory database...');
  await memoryAdapter.connect();
  activeAdapter = memoryAdapter;
  usingMemory = true;
  return true;
};

/**
 * Get a collection from the active database
 * @param {string} collectionName - Name of the collection
 * @returns {Object} - Collection interface
 */
const getCollection = (collectionName) => {
  if (!activeAdapter) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return activeAdapter.collection(collectionName);
};

/**
 * Check if using Replit Database
 * @returns {boolean} - True if using Replit Database
 */
const isUsingReplitDB = () => usingReplitDB;

/**
 * Check if using MongoDB
 * @returns {boolean} - True if using MongoDB
 */
const isUsingMongoDB = () => usingMongoDB;

/**
 * Check if using in-memory database
 * @returns {boolean} - True if using in-memory database
 */
const isUsingMemory = () => usingMemory;

module.exports = {
  connectDB,
  getCollection,
  isUsingReplitDB,
  isUsingMongoDB,
  isUsingMemory
};
