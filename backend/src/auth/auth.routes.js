// backend/src/auth/auth.routes.js

/**
 * Authentication routes for Job Application SaaS backend.
 * Exposes endpoints for user registration and login.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { register, login } = require('./auth.controller');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT
 * @access Public
 */
router.post('/login', login);

module.exports = router;