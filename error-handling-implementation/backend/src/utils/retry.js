/**
 * Retry Utility
 *
 * This module provides utilities for retrying operations that may fail
 * due to transient errors. It implements exponential backoff to avoid
 * overwhelming the target service.
 */

const logger = require('./logger');
const { ExternalServiceError } = require('./errors');

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.baseDelay - Base delay in ms between retries
 * @param {number} options.maxDelay - Maximum delay in ms between retries
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @param {string} options.operationName - Name of the operation for logging
 * @returns {Promise<any>} - Result of the operation
 * @throws {Error} - If all retry attempts fail
 */
async function retry(operation, options = {}) {
  // Default options
  const {
    maxRetries = 3,
    baseDelay = 300,
    maxDelay = 3000,
    shouldRetry = defaultShouldRetry,
    operationName = 'unknown operation'
  } = options;

  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(error)) {
        logger.warn(`Retry failed for ${operationName}`, {
          attempts: attempt,
          maxRetries,
          error: error.message
        });
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateBackoff(attempt, baseDelay, maxDelay);

      logger.info(`Retrying ${operationName} (attempt ${attempt}/${maxRetries}) after ${delay}ms`, {
        error: error.message
      });

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never happen, but just in case
  throw lastError;
}

/**
 * Default function to determine if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether the error is retryable
 */
function defaultShouldRetry(error) {
  // Network errors are usually transient
  if (error.code === 'ECONNRESET' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.code === 'ESOCKETTIMEDOUT') {
    return true;
  }

  // Retry on 429 (Too Many Requests) and 5xx errors
  if (error.statusCode === 429 || 
      (error.statusCode >= 500 && error.statusCode < 600)) {
    return true;
  }

  // Don't retry on client errors (4xx) except 429
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return false;
  }

  // By default, don't retry
  return false;
}

/**
 * Calculate backoff delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number
 * @param {number} baseDelay - Base delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @returns {number} - Delay in ms
 */
function calculateBackoff(attempt, baseDelay, maxDelay) {
  // Calculate exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Add jitter: random value between 0 and 1 * exponentialDelay * 0.2
  const jitter = Math.random() * exponentialDelay * 0.2;
  
  // Apply jitter and cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>} - Promise that resolves after the duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retryable version of a function
 * @param {Function} fn - Function to make retryable
 * @param {Object} options - Retry options
 * @returns {Function} - Retryable function
 */
function makeRetryable(fn, options = {}) {
  return async (...args) => {
    return retry(() => fn(...args), options);
  };
}

module.exports = {
  retry,
  makeRetryable,
  defaultShouldRetry
};