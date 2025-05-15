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

const { User, Setting } = require('../models');

// Get current user's profile
async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    // Find user in database
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Update current user's profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { email, name, phone, location, bio, jobTitle } = req.body;

    // Find user in database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }

      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email is already in use.' });
      }

      user.email = email;
    }

    // Update other profile fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (bio) user.bio = bio;
    if (jobTitle) user.jobTitle = jobTitle;

    // Save updated user to database
    await user.save();

    // Return the updated profile without password
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      message: 'Profile updated successfully.',
      profile: userObj
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getSettings(req, res) {
  try {
    const userId = req.user.id;

    // Find settings in database
    let settings = await Setting.findOne({ userId });

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Setting({
        userId,
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

      // Save default settings to database
      await settings.save();
    }

    return res.status(200).json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function saveSettings(req, res) {
  try {
    const userId = req.user.id;
    const { provider, model, apiKeys } = req.body;

    // Find settings in database or create new settings
    let settings = await Setting.findOne({ userId });
    if (!settings) {
      settings = new Setting({
        userId,
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
    }

    // Update settings with provided values
    if (typeof provider === 'string') {
      settings.provider = provider;
    }
    if (typeof model === 'string') {
      settings.model = model;
    }

    // Update API keys if provided
    if (apiKeys && typeof apiKeys === 'object') {
      if (!settings.apiKeys) {
        settings.apiKeys = {};
      }

      if (typeof apiKeys.openai === 'string') {
        settings.apiKeys.openai = apiKeys.openai;
      }
      if (typeof apiKeys.gemini === 'string') {
        settings.apiKeys.gemini = apiKeys.gemini;
      }
      if (typeof apiKeys.openrouter === 'string') {
        settings.apiKeys.openrouter = apiKeys.openrouter;
      }
      if (typeof apiKeys.anthropic === 'string') {
        settings.apiKeys.anthropic = apiKeys.anthropic;
      }
      if (typeof apiKeys.mistral === 'string') {
        settings.apiKeys.mistral = apiKeys.mistral;
      }
    }

    // Save updated settings to database
    await settings.save();

    return res.status(200).json({
      message: 'Settings saved successfully.',
      settings
    });
  } catch (err) {
    console.error('Save settings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  saveSettings,
};