// backend/src/users/user.routes.js

/**
 * User profile routes for Job Application SaaS backend.
 * Provides endpoints to get and update user profiles.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { getProfile, updateProfile, getSettings, saveSettings } = require('./user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private (JWT required)
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update current user's profile
 * @access Private (JWT required)
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @route GET /api/users/settings
 * @desc Get current user's AI settings
 * @access Private (JWT required)
 */
router.get('/settings', authMiddleware, getSettings);

/**
 * @route PUT /api/users/settings
 * @desc Save current user's AI settings
 * @access Private (JWT required)
 */
router.put('/settings', authMiddleware, saveSettings);

module.exports = router;