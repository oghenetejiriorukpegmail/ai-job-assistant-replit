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
const { User, Setting } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');
require('dotenv').config();

// Secret key for JWT from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'ABCDEFGhijkLMNOPqrsTUvwxYZ123456789';

// Get in-memory store for fallback mode
const getUsers = () => {
  if (isUsingFallback()) {
    return getInMemoryStore().users;
  }
  return null;
};

// Register new user
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    // Basic input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check if we're using fallback mode
    if (isUsingFallback()) {
      const users = getUsers();

      // Check if user already exists in memory
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user in memory
      const userId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: userId,
        _id: userId.toString(), // Add _id for MongoDB compatibility
        email,
        password: hashedPassword,
        name: name || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add user to memory store
      users.push(newUser);

      // Create default settings
      const settings = getInMemoryStore().settings;
      const userSettings = {
        userId: userId.toString(),
        provider: 'google',
        model: 'gemini-2.5-pro-exp-03-25',
        apiKeys: {
          openai: '',
          gemini: '',
          openrouter: '',
          anthropic: '',
          mistral: ''
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add settings to memory store
      settings.push(userSettings);
    } else {
      // MongoDB mode
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user in database
      const newUser = new User({
        email,
        password: hashedPassword,
        name: name || ''
      });

      // Save user to database
      const savedUser = await newUser.save();

      // Create default settings for the user
      const userSettings = new Setting({
        userId: savedUser._id,
        provider: 'google',
        model: 'gemini-2.5-pro-exp-03-25',
        apiKeys: {
          openai: '',
          gemini: '',
          openrouter: '',
          anthropic: '',
          mistral: ''
        }
      });

      // Save settings to database
      await userSettings.save();
    }

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

    let user;

    // Check if we're using fallback mode
    if (isUsingFallback()) {
      const users = getUsers();

      // Find user in memory
      user = users.find(u => u.email === email);
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
        expiresIn: '24h', // Increased token expiration to 24 hours
      });

      return res.status(200).json({ token });
    } else {
      // MongoDB mode
      // Find user in database
      user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '24h', // Increased token expiration to 24 hours
      });

      return res.status(200).json({ token });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  register,
  login
};