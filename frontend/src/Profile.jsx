// frontend/src/Profile.jsx

/**
 * User profile management component.
 * Allows viewing and updating profile, resume, preferences, and matched jobs.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import ResumeUpload from './ResumeUpload';
import PreferencesWizard from './PreferencesWizard';
import JobMatches from './JobMatches';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
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

      <ResumeUpload />

      <PreferencesWizard />

      <JobMatches />
    </div>
  );
}

export default Profile;