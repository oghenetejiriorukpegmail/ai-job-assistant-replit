// backend/src/preferences/preferences.controller.js

/**
 * Matching preferences controller.
 * Handles saving and retrieving user job matching preferences.
 *
 * Security-first approach:
 * - JWT authentication required
 * - Input validation
 *
 * Author: Roo
 * Date: 2025-04-07
 */

const { Preference } = require('../models');

// Save or update user preferences
async function savePreferences(req, res) {
  try {
    const userId = req.user.id;
    const { mode, jobTitles } = req.body;

    if (!mode || !['resume', 'titles'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "resume" or "titles".' });
    }

    if (mode === 'titles' && (!Array.isArray(jobTitles) || jobTitles.length === 0)) {
      return res.status(400).json({ error: 'Job titles list required for title-based matching.' });
    }

    // Check if preference exists
    let preference = await Preference.findOne({ userId });

    if (preference) {
      // Update existing preference
      preference.mode = mode;
      preference.jobTitles = jobTitles || [];
      await preference.save();
    } else {
      // Create new preference
      preference = new Preference({
        userId,
        mode,
        jobTitles: jobTitles || []
      });
      await preference.save();
    }

    return res.status(200).json({
      message: 'Preferences saved successfully.',
      preference
    });
  } catch (err) {
    console.error('Save preferences error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Get user preferences
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    const preference = await Preference.findOne({ userId });

    if (!preference) {
      return res.status(404).json({ error: 'Preferences not found.' });
    }

    return res.status(200).json(preference);
  } catch (err) {
    console.error('Get preferences error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  savePreferences,
  getPreferences,
};