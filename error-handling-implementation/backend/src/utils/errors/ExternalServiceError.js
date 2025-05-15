/**
 * External Service Error Class
 * 
 * This error class is used for external service failures.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class ExternalServiceError extends AppError {
  /**
   * Create a new ExternalServiceError
   * @param {string} message - Error message
   * @param {string} service - Name of the external service
   * @param {any} data - Additional error data
   */
  constructor(message = 'External service error', service = 'unknown', data = {}) {
    super(
      message, 
      502, 
      true, 
      'EXTERNAL_SERVICE_ERROR', 
      { ...data, service }
    );
    this.service = service;
  }
}

module.exports = ExternalServiceError;