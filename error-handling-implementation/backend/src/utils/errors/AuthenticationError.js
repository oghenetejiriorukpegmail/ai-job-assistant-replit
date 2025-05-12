/**
 * Authentication Error Class
 * 
 * This error class is used for authentication failures.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class AuthenticationError extends AppError {
  /**
   * Create a new AuthenticationError
   * @param {string} message - Error message
   * @param {any} data - Additional error data
   */
  constructor(message = 'Authentication failed', data = {}) {
    super(message, 401, true, 'AUTHENTICATION_ERROR', data);
  }
}

module.exports = AuthenticationError;