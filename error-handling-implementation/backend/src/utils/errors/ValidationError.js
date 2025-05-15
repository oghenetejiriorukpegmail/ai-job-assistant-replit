/**
 * Validation Error Class
 * 
 * This error class is used for input validation errors.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class ValidationError extends AppError {
  /**
   * Create a new ValidationError
   * @param {string} message - Error message
   * @param {any} data - Validation error details
   */
  constructor(message = 'Validation failed', data = {}) {
    super(message, 400, true, 'VALIDATION_ERROR', data);
  }
}

module.exports = ValidationError;