/**
 * Middleware to add a warning header when using in-memory fallback
 * This helps inform clients that data will not persist
 */

const { isUsingFallback } = require('../config/database');

const fallbackWarningMiddleware = (req, res, next) => {
  if (isUsingFallback()) {
    // Add a warning header to the response
    res.set('X-Database-Mode', 'in-memory-fallback');
    res.set('X-Warning', 'Using in-memory storage. Data will not persist after server restart.');
  } else {
    res.set('X-Database-Mode', 'mongodb');
  }
  next();
};

module.exports = fallbackWarningMiddleware;
