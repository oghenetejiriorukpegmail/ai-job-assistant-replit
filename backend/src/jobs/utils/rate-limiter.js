/**
 * Rate Limiter Utility
 *
 * This module provides rate limiting functionality for API calls.
 * It helps prevent exceeding API rate limits by throttling requests.
 */

const logger = require('../../utils/logger');

// Store for tracking API calls per source
const apiCallTracker = {};

/**
 * Create a rate limiter for a specific API source
 * @param {string} source - API source name
 * @param {number} maxCalls - Maximum number of calls allowed
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {Object} - Rate limiter object
 */
function createRateLimiter(source, maxCalls, timeWindowMs) {
  if (!apiCallTracker[source]) {
    apiCallTracker[source] = {
      calls: [],
      maxCalls,
      timeWindowMs
    };
  }

  return {
    /**
     * Check if a call can be made without exceeding rate limits
     * @returns {boolean} - True if call is allowed, false otherwise
     */
    canMakeCall: function() {
      const tracker = apiCallTracker[source];
      const now = Date.now();

      // Remove expired calls
      tracker.calls = tracker.calls.filter(timestamp =>
        now - timestamp < tracker.timeWindowMs
      );

      return tracker.calls.length < tracker.maxCalls;
    },

    /**
     * Record a call to the API
     */
    recordCall: function() {
      const tracker = apiCallTracker[source];
      tracker.calls.push(Date.now());
    },

    /**
     * Get time until next available call slot
     * @returns {number} - Milliseconds until next available slot
     */
    getTimeUntilNextSlot: function() {
      const tracker = apiCallTracker[source];

      if (this.canMakeCall()) {
        return 0;
      }

      const oldestCall = Math.min(...tracker.calls);
      return oldestCall + tracker.timeWindowMs - Date.now();
    },

    /**
     * Wait until a call can be made
     * @returns {Promise<void>} - Resolves when a call can be made
     */
    waitForSlot: async function() {
      if (this.canMakeCall()) {
        return;
      }

      const waitTime = this.getTimeUntilNextSlot();
      logger.debug(`Rate limit reached for ${source}. Waiting ${waitTime}ms`);

      return new Promise(resolve => {
        setTimeout(resolve, waitTime);
      });
    },

    /**
     * Execute a function with rate limiting
     * @param {Function} fn - Function to execute
     * @param {Array} args - Arguments to pass to the function
     * @returns {Promise<any>} - Result of the function
     */
    execute: async function(fn, ...args) {
      await this.waitForSlot();
      this.recordCall();

      try {
        return await fn(...args);
      } catch (error) {
        throw error;
      }
    }
  };
}

// Common rate limiters for popular job boards
const rateLimiters = {
  linkedin: createRateLimiter('linkedin', 100, 60 * 60 * 1000), // 100 calls per hour
  indeed: createRateLimiter('indeed', 50, 60 * 60 * 1000),      // 50 calls per hour
  glassdoor: createRateLimiter('glassdoor', 30, 60 * 60 * 1000), // 30 calls per hour
  googleJobs: createRateLimiter('googleJobs', 100, 60 * 60 * 1000), // 100 calls per hour
  remotive: createRateLimiter('remotive', 50, 60 * 60 * 1000)    // 50 calls per hour
};

module.exports = {
  createRateLimiter,
  rateLimiters
};
