/**
 * Not Found Error Class
 * 
 * This error class is used for resource not found errors.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class NotFoundError extends AppError {
  /**
   * Create a new NotFoundError
   * @param {string} message - Error message
   * @param {any} data - Additional error data
   */
  constructor(message = 'Resource not found', data = {}) {
    super(message, 404, true, 'NOT_FOUND_ERROR', data);
  }
}

module.exports = NotFoundError;