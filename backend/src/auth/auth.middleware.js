// backend/src/auth/auth.middleware.js

/**
 * JWT authentication middleware for Job Application SaaS backend.
 * Protects routes by verifying JWT tokens.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = {
  authenticateJWT,
};