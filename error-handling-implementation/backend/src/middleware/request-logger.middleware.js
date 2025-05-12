/**
 * Request Logger Middleware
 *
 * This middleware logs details about incoming requests and outgoing responses.
 * It captures request method, path, query parameters, and response status code.
 * It also measures request duration for performance monitoring.
 */

const logger = require('../utils/logger');

/**
 * Request logger middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestLoggerMiddleware(req, res, next) {
  // Capture request start time
  const startTime = Date.now();
  
  // Log request details
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    query: req.query,
    params: req.params,
    // Don't log sensitive body data like passwords
    body: sanitizeRequestBody(req.body)
  });
  
  // Capture original end method
  const originalEnd = res.end;
  
  // Override end method to log response details
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Restore original end method
    res.end = originalEnd;
    
    // Call original end method
    res.end(chunk, encoding);
    
    // Log response details
    logger.info(`Response sent: ${req.method} ${req.path} ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  };
  
  next();
}

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} - Sanitized body
 */
function sanitizeRequestBody(body) {
  if (!body) return {};
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to redact
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credit_card'];
  
  // Redact sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

module.exports = requestLoggerMiddleware;