/**
 * Authorization Error Class
 * 
 * This error class is used for permission issues.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class AuthorizationError extends AppError {
  /**
   * Create a new AuthorizationError
   * @param {string} message - Error message
   * @param {any} data - Additional error data
   */
  constructor(message = 'You do not have permission to perform this action', data = {}) {
    super(message, 403, true, 'AUTHORIZATION_ERROR', data);
  }
}

module.exports = AuthorizationError;