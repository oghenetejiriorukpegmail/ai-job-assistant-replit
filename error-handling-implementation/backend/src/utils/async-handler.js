/**
 * Async Handler Utility
 *
 * This utility wraps async controller methods to catch errors and pass them
 * to the Express error handler. It eliminates the need for try-catch blocks
 * in every controller method.
 */

/**
 * Wrap an async function to catch errors and pass them to the Express error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;