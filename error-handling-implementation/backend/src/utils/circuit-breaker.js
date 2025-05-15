/**
 * Circuit Breaker Pattern Implementation
 *
 * This module implements the circuit breaker pattern for external service calls.
 * It helps prevent cascading failures by failing fast when a service is unavailable.
 */

const { ExternalServiceError } = require('./errors');
const logger = require('./logger');

// Circuit breaker states
const STATES = {
  CLOSED: 'CLOSED',       // Normal operation, requests pass through
  OPEN: 'OPEN',           // Failing fast, no requests pass through
  HALF_OPEN: 'HALF_OPEN'  // Testing if service has recovered
};

class CircuitBreaker {
  /**
   * Create a new circuit breaker
   * @param {string} serviceName - Name of the service being protected
   * @param {Object} options - Circuit breaker options
   * @param {number} options.failureThreshold - Number of failures before opening circuit
   * @param {number} options.resetTimeout - Time in ms before trying half-open state
   * @param {number} options.halfOpenSuccessThreshold - Successes needed to close circuit
   */
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;

    // Default options
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenSuccessThreshold: 2,
      ...options
    };

    logger.info(`Circuit breaker created for service: ${serviceName}`, {
      options: this.options
    });
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} - Result of the function
   * @throws {ExternalServiceError} - If circuit is open or function fails
   */
  async execute(fn, operationName = 'unknown') {
    // Check if circuit is open
    if (this.state === STATES.OPEN) {
      // Check if it's time to try half-open state
      if (Date.now() >= this.nextAttemptTime) {
        this.toHalfOpen();
      } else {
        logger.warn(`Circuit open for ${this.serviceName}, failing fast`, {
          operation: operationName,
          nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
        });
        throw new ExternalServiceError(
          `Service ${this.serviceName} is currently unavailable`,
          this.serviceName,
          { operation: operationName, circuitState: this.state }
        );
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // Record success
      this.onSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error);

      // Enhance error with circuit breaker context
      if (error instanceof ExternalServiceError) {
        error.data = {
          ...error.data,
          circuitState: this.state,
          failureCount: this.failureCount
        };
        throw error;
      } else {
        // Wrap other errors in ExternalServiceError
        throw new ExternalServiceError(
          error.message || `${this.serviceName} operation failed`,
          this.serviceName,
          {
            operation: operationName,
            circuitState: this.state,
            failureCount: this.failureCount,
            originalError: error.toString()
          }
        );
      }
    }
  }

  /**
   * Handle successful operation
   */
  onSuccess() {
    if (this.state === STATES.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.toClose();
      }
    } else if (this.state === STATES.CLOSED) {
      // Reset failure count after some successes in closed state
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Handle failed operation
   * @param {Error} error - Error that occurred
   */
  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker failure for ${this.serviceName}`, {
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
      state: this.state,
      error: error.message
    });

    if (this.state === STATES.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.toOpen();
    } else if (this.state === STATES.HALF_OPEN) {
      this.toOpen();
    }
  }

  /**
   * Transition to open state
   */
  toOpen() {
    this.state = STATES.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    
    logger.info(`Circuit opened for ${this.serviceName}`, {
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
  }

  /**
   * Transition to half-open state
   */
  toHalfOpen() {
    this.state = STATES.HALF_OPEN;
    this.successCount = 0;
    
    logger.info(`Circuit half-opened for ${this.serviceName}`);
  }

  /**
   * Transition to closed state
   */
  toClose() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info(`Circuit closed for ${this.serviceName}`);
  }

  /**
   * Get current circuit state
   * @returns {string} - Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    logger.info(`Circuit reset for ${this.serviceName}`);
  }
}

module.exports = {
  CircuitBreaker,
  STATES
};