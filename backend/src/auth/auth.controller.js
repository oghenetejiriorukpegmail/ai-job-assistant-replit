// backend/src/auth/auth.controller.js

/**
 * Authentication controller for Job Application SaaS backend.
 * Handles user registration and login with JWT.
 * 
 * Security-first approach:
 * - Passwords hashed with bcrypt
 * - JWT signed with secret key
 * - Input validation
 * - Avoid leaking sensitive info in errors
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// In-memory user store (replace with DB integration)
const users = [];

// Secret key for JWT (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register new user
async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user
    const user = { id: users.length + 1, email, password: hashedPassword };
    users.push(user);

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// User login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  register,
  login,
};