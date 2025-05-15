/**
 * Database Error Class
 * 
 * This error class is used for database operation failures.
 * It extends the AppError class and sets appropriate defaults.
 */

const AppError = require('./AppError');

class DatabaseError extends AppError {
  /**
   * Create a new DatabaseError
   * @param {string} message - Error message
   * @param {string} operation - Database operation that failed
   * @param {any} data - Additional error data
   */
  constructor(message = 'Database operation failed', operation = 'unknown', data = {}) {
    super(
      message, 
      500, 
      true, 
      'DATABASE_ERROR', 
      { ...data, operation }
    );
    this.operation = operation;
  }
}

module.exports = DatabaseError;