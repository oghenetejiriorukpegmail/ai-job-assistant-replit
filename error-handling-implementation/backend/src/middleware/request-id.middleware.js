/**
 * Request ID Middleware
 *
 * This middleware generates a unique ID for each request and adds it to
 * the request object and response headers. This ID can be used for tracking
 * requests across the system and correlating logs.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Generate a unique request ID
 * @returns {string} - Unique request ID
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Request ID middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestIdMiddleware(req, res, next) {
  // Generate a unique request ID
  const requestId = generateRequestId();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Create context for this request
  const context = {
    requestId,
    path: req.path,
    method: req.method,
    userId: req.user ? req.user.id : undefined
  };
  
  // Run the rest of the request with this context
  logger.requestContextStore.run(context, next);
}

module.exports = requestIdMiddleware;