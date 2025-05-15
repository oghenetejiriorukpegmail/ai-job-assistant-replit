/**
 * Base Application Error Class
 * 
 * This is the base error class for all application errors.
 * It extends the native Error class and adds additional properties
 * for better error handling and logging.
 */

class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error
   * @param {string} code - Error code for client-side error handling
   * @param {any} data - Additional error data
   */
  constructor(message, statusCode = 500, isOperational = true, code = 'INTERNAL_ERROR', data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.data = data;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;