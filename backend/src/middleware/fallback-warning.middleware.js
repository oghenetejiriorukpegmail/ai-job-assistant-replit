/**
 * Middleware to warn about database fallback
 * 
 * This middleware adds a header to responses when the application
 * is using a fallback storage mechanism (in-memory or Replit Database).
 */

const { isUsingMemory, isUsingReplitDB } = require('../config/database');

module.exports = function fallbackWarningMiddleware(req, res, next) {
  // Add warning header if using in-memory storage
  if (isUsingMemory()) {
    res.setHeader('X-Storage-Warning', 'Using in-memory storage. Data will not persist after server restart.');
  } 
  // Add info header if using Replit Database
  else if (isUsingReplitDB()) {
    res.setHeader('X-Storage-Info', 'Using Replit Database for storage.');
  }
  
  next();
};
