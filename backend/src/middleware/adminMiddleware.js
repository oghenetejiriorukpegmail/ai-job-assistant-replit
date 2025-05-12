/**
 * Admin Middleware
 * 
 * Middleware to check if the user has admin role.
 */

const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Check if the user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function adminMiddleware(req, res, next) {
  try {
    // User ID should be set by the auth middleware
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user has admin role
    if (!user.roles || !user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    // User is admin, proceed
    next();
  } catch (error) {
    logger.error('Error in admin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = adminMiddleware;
