/**
 * Authentication middleware for protecting routes
 * Verifies JWT token and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'ABCDEFGhijkLMNOPqrsTUvwxYZ123456789';

// Get in-memory store for fallback mode
const getUsers = () => {
  if (isUsingFallback()) {
    return getInMemoryStore().users;
  }
  return null;
};

/**
 * Middleware to verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Invalid token format.' });
    }

    try {
      // Verify token
      console.log('Verifying token with secret:', JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);

      // Check if we're using fallback mode
      if (isUsingFallback()) {
        const users = getUsers();

        // Find user by ID in memory
        const user = users.find(u => u.id === decoded.userId);
        if (!user) {
          return res.status(401).json({ error: 'User not found.' });
        }

        // Attach user to request
        req.user = user;
        req.user.id = user.id;
      } else {
        // MongoDB mode
        // Find user by ID in database
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ error: 'User not found.' });
        }

        // Attach user to request
        req.user = user;
        req.user.id = user._id;
      }

      next();
    } catch (err) {
      console.error('JWT verification error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      return res.status(401).json({ error: 'Invalid token: ' + err.message });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = authMiddleware;
