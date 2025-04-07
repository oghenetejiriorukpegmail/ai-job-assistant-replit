// frontend/src/PreferencesWizard.jsx

/**
 * Matching Preferences Wizard component.
 * Allows user to select matching mode and provide job titles.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';

function PreferencesWizard() {
  const [mode, setMode] = useState('resume');
  const [jobTitles, setJobTitles] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const data = await apiRequest('/api/preferences');
      setMode(data.mode);
      setJobTitles((data.jobTitles || []).join(', '));
    } catch (err) {
      // ignore if not set
    }
  }

  async function savePreferences() {
    setError('');
    setMessage('');
    try {
      const payload = { mode };
      if (mode === 'titles') {
        payload.jobTitles = jobTitles.split(',').map(t => t.trim()).filter(Boolean);
      }
      await apiRequest('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMessage('Preferences saved.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h3>Matching Preferences</h3>
      <label>
        <input
          type="radio"
          value="resume"
          checked={mode === 'resume'}
          onChange={() => setMode('resume')}
        />
        Match based on uploaded resume
      </label>
      <br />
      <label>
        <input
          type="radio"
          value="titles"
          checked={mode === 'titles'}
          onChange={() => setMode('titles')}
        />
        Match based on job titles
      </label>
      <br />
      {mode === 'titles' && (
        <textarea
          placeholder="Enter job titles, separated by commas"
          value={jobTitles}
          onChange={(e) => setJobTitles(e.target.value)}
        />
      )}
      <br />
      <button onClick={savePreferences}>Save Preferences</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PreferencesWizard;