/**
 * Global Error Handler Middleware
 *
 * This middleware catches all errors thrown in the application and formats
 * them into a consistent response format. It also logs errors with context
 * for troubleshooting.
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Determine if we're in development environment
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Format error for response
 * @param {Error} err - Error object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object} - Formatted error
 */
function formatError(err, includeStack = false) {
  // Base error response
  const errorResponse = {
    status: 'error',
    message: err.message || 'Something went wrong',
    code: err.code || 'INTERNAL_ERROR'
  };

  // Add request ID for tracking
  if (err.requestId) {
    errorResponse.requestId = err.requestId;
  }

  // Add additional error data if it exists
  if (err.data) {
    errorResponse.data = err.data;
  }

  // Add stack trace in development
  if (includeStack && err.stack) {
    errorResponse.stack = err.stack;
  }

  return errorResponse;
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandlerMiddleware(err, req, res, next) {
  // Add request ID to error for tracking
  err.requestId = req.requestId;

  // Default status code
  const statusCode = err.statusCode || 500;

  // Log error with context
  if (statusCode >= 500) {
    logger.error(`Server error: ${err.message}`, err);
  } else {
    logger.warn(`Client error: ${err.message}`, err);
  }

  // Convert error to AppError if it's not already
  if (!(err instanceof AppError)) {
    const isOperational = statusCode < 500;
    err = new AppError(
      err.message || 'Internal server error',
      statusCode,
      isOperational,
      err.code || 'INTERNAL_ERROR',
      err.data
    );
  }

  // Format error for response
  const errorResponse = formatError(err, isDevelopment);

  // Send error response
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandlerMiddleware;