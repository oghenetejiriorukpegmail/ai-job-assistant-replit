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

const preferences = []; // In-memory store (replace with DB)

// Save or update user preferences
function savePreferences(req, res) {
  try {
    const userId = req.user.userId;
    const { mode, jobTitles } = req.body;

    if (!mode || !['resume', 'titles'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "resume" or "titles".' });
    }

    if (mode === 'titles' && (!Array.isArray(jobTitles) || jobTitles.length === 0)) {
      return res.status(400).json({ error: 'Job titles list required for title-based matching.' });
    }

    // Check if preference exists
    const existing = preferences.find(p => p.userId === userId);
    if (existing) {
      existing.mode = mode;
      existing.jobTitles = jobTitles || [];
    } else {
      preferences.push({ userId, mode, jobTitles: jobTitles || [] });
    }

    return res.status(200).json({ message: 'Preferences saved successfully.' });
  } catch (err) {
    console.error('Save preferences error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Get user preferences
function getPreferences(req, res) {
  try {
    const userId = req.user.userId;
    const pref = preferences.find(p => p.userId === userId);

    if (!pref) {
      return res.status(404).json({ error: 'Preferences not found.' });
    }

    return res.status(200).json(pref);
  } catch (err) {
    console.error('Get preferences error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  savePreferences,
  getPreferences,
};