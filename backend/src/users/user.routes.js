// backend/src/users/user.routes.js

/**
 * User profile routes for Job Application SaaS backend.
 * Provides endpoints to get and update user profiles.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { getProfile, updateProfile } = require('./user.controller');
const { authenticateJWT } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private (JWT required)
 */
router.get('/profile', authenticateJWT, getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update current user's profile
 * @access Private (JWT required)
 */
router.put('/profile', authenticateJWT, updateProfile);

module.exports = router;