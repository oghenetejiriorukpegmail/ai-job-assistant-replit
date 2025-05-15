/**
 * Enhanced Logger Utility
 *
 * This module provides structured logging functionality for the application.
 * It supports different log levels, request context, and correlation IDs.
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
let currentLogLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

// Store request context in AsyncLocalStorage (for Node.js) or use a simple Map as fallback
let requestContextStore;

try {
  // Try to use AsyncLocalStorage if available (Node.js 12.17.0+)
  const { AsyncLocalStorage } = require('async_hooks');
  requestContextStore = new AsyncLocalStorage();
} catch (error) {
  // Fallback to a simple Map-based implementation
  console.warn('AsyncLocalStorage not available, using fallback context store');
  
  // Use a Map to store context by request ID
  const contextMap = new Map();
  
  requestContextStore = {
    getStore: () => {
      // In this fallback, we'll use a global requestId variable set by middleware
      return global.requestId ? contextMap.get(global.requestId) : undefined;
    },
    run: (context, callback) => {
      if (context.requestId) {
        contextMap.set(context.requestId, context);
        global.requestId = context.requestId;
        try {
          return callback();
        } finally {
          global.requestId = undefined;
        }
      }
      return callback();
    }
  };
}

/**
 * Format a log message with context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const context = requestContextStore.getStore() || {};
  const { requestId, userId, path, method } = context;
  
  // Create base log object
  const logObject = {
    timestamp,
    level,
    message,
    requestId,
    userId,
    path,
    method
  };

  // Add additional data
  if (data !== undefined) {
    if (data instanceof Error) {
      logObject.error = {
        name: data.name,
        message: data.message,
        stack: data.stack,
        code: data.code
      };
      
      // Add custom error properties
      if (data.statusCode) logObject.error.statusCode = data.statusCode;
      if (data.isOperational) logObject.error.isOperational = data.isOperational;
      if (data.data) logObject.error.data = data.data;
    } else {
      logObject.data = data;
    }
  }

  return JSON.stringify(logObject);
}

/**
 * Log a message if the current log level allows it
 * @param {string} level - Log level
 * @param {number} levelValue - Numeric log level value
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 */
function log(level, levelValue, message, data) {
  if (levelValue <= currentLogLevel) {
    const formattedMessage = formatLogMessage(level, message, data);

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

module.exports = {
  error: (message, data) => log('ERROR', LOG_LEVELS.ERROR, message, data),
  warn: (message, data) => log('WARN', LOG_LEVELS.WARN, message, data),
  info: (message, data) => log('INFO', LOG_LEVELS.INFO, message, data),
  debug: (message, data) => log('DEBUG', LOG_LEVELS.DEBUG, message, data),
  setLogLevel: (level) => {
    if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
      currentLogLevel = LOG_LEVELS[level.toUpperCase()];
    }
  },
  requestContextStore,
  LOG_LEVELS
};