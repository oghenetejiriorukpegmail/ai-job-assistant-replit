// frontend/src/Profile.jsx

/**
 * User profile management component.
 * Allows viewing and updating profile, resume, and preferences.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState(null);
  const [resumeContent, setResumeContent] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
    fetchResume();
  }, []);

  async function fetchProfile() {
    try {
      const data = await apiRequest('/api/users/profile');
      setProfile(data);
      setEmail(data.email);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchPreferences() {
    try {
      const data = await apiRequest('/api/preferences');
      setPreferences(data);
    } catch (err) {
      // ignore if not set
    }
  }

  async function fetchResume() {
    try {
      const res = await apiRequest('/api/resumes/user'); // Placeholder, implement backend later
      setResumeContent(res.content);
    } catch (err) {
      // ignore if not set
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiRequest('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>User Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={updateProfile}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>
        <button type="submit">Update Profile</button>
      </form>

      <h3>Matching Preferences</h3>
      {preferences ? (
        <pre>{JSON.stringify(preferences, null, 2)}</pre>
      ) : (
        <p>No preferences set.</p>
      )}

      <h3>Parsed Resume Content</h3>
      {resumeContent ? (
        <pre>{resumeContent}</pre>
      ) : (
        <p>No resume uploaded.</p>
      )}
    </div>
  );
}

export default Profile;