// backend/src/preferences/preferences.routes.js

/**
 * Matching preferences routes.
 * Provides endpoints to save and retrieve user job matching preferences.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const express = require('express');
const { savePreferences, getPreferences } = require('./preferences.controller');
const { authenticateJWT } = require('../auth/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/preferences
 * @desc Save or update user matching preferences
 * @access Private (JWT required)
 */
router.post('/', authenticateJWT, savePreferences);

/**
 * @route GET /api/preferences
 * @desc Get user matching preferences
 * @access Private (JWT required)
 */
router.get('/', authenticateJWT, getPreferences);

module.exports = router;