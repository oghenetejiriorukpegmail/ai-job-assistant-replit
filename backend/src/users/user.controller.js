// backend/src/users/user.controller.js

/**
 * User profile controller for Job Application SaaS backend.
 * Handles retrieval and update of user profiles.
 * 
 * Security-first approach:
 * - JWT authentication required
 * - Input validation
 * - Avoid leaking sensitive info
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const users = require('../auth/auth.controller').users; // Temporary shared in-memory store

// Get current user's profile
function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Exclude password hash
    const { password, ...profile } = user;
    return res.status(200).json(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Update current user's profile
function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { email } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (email) {
      user.email = email;
    }

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
};