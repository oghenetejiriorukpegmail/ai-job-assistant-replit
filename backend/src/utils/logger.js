/**
 * Logger Utility
 *
 * This module provides logging functionality for the application.
 * It supports different log levels and formats.
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

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;

  if (data !== undefined) {
    if (data instanceof Error) {
      formattedMessage += `\n${data.stack || data.message}`;
    } else if (typeof data === 'object') {
      try {
        formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
      } catch (error) {
        formattedMessage += `\n[Object]`;
      }
    } else {
      formattedMessage += `\n${data}`;
    }
  }

  return formattedMessage;
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
  LOG_LEVELS
};
