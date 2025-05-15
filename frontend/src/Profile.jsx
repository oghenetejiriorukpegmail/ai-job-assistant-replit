// frontend/src/Profile.jsx

/**
 * User profile management component.
 * Displays profile, resume upload, preferences, matched jobs, and parsed resume data.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import ResumeUpload from './ResumeUpload';
import PreferencesWizard from './PreferencesWizard';
import JobMatches from './JobMatches';
import { saveUserProfile, getUserProfile, getResumeData, saveResumeData } from './services/storage-service';

function Profile() {
  // User profile data
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // AI parsing is always enabled by default

  useEffect(() => {
    fetchProfile();
    fetchResumeData();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    try {
      // Try to get from API first
      try {
        const data = await apiRequest('/api/users/profile');
        setEmail(data.email);
        setName(data.name || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setJobTitle(data.jobTitle || '');

        // Save to local storage
        saveUserProfile({
          email: data.email,
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          jobTitle: data.jobTitle || ''
        });
      } catch (apiErr) {
        // If API fails, load from localStorage
        console.log('Loading profile from local storage');
        const localProfile = getUserProfile();
        setEmail(localProfile.email);
        setName(localProfile.name);
        setPhone(localProfile.phone);
        setLocation(localProfile.location);
        setBio(localProfile.bio);
        setJobTitle(localProfile.jobTitle);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchResumeData() {
    try {
      try {
        // Try to get from API first
        const data = await apiRequest('/api/resumes/user');
        if (data) {
          setResumeData(data);
          // Save to local storage
          saveResumeData(data);
        } else {
          // If no data from API, try localStorage
          const localResumeData = getResumeData();
          if (localResumeData) {
            setResumeData(localResumeData);
          }
        }
      } catch (apiErr) {
        // If API fails, load from localStorage
        console.log('Loading resume data from local storage');
        const localResumeData = getResumeData();
        if (localResumeData) {
          setResumeData(localResumeData);
        }
      }
    } catch (err) {
      console.error('Error fetching resume data:', err);
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      // Basic validation
      if (!email) {
        setError('Email is required');
        setIsSaving(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsSaving(false);
        return;
      }

      // Create profile data object
      const profileData = {
        email,
        name,
        phone,
        location,
        bio,
        jobTitle
      };

      try {
        // Try to update via API
        const response = await apiRequest('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name,
            phone,
            location,
            bio,
            jobTitle
          }),
        });

        if (response.profile) {
          // Update profile data
          setEmail(response.profile.email);
          setName(response.profile.name || '');
          setPhone(response.profile.phone || '');
          setLocation(response.profile.location || '');
          setBio(response.profile.bio || '');
          setJobTitle(response.profile.jobTitle || '');

          // Update the profile data object with response data
          profileData.email = response.profile.email;
          profileData.name = response.profile.name || '';
          profileData.phone = response.profile.phone || '';
          profileData.location = response.profile.location || '';
          profileData.bio = response.profile.bio || '';
          profileData.jobTitle = response.profile.jobTitle || '';
        }
      } catch (apiErr) {
        console.log('API update failed, saving to local storage only');
      }

      // Save to local storage regardless of API success
      saveUserProfile(profileData);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="card profile-card">
        <h2>User Profile</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {isLoading ? (
          <div className="loading-spinner">Loading profile...</div>
        ) : (
          <form onSubmit={updateProfile}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your email address"
                disabled={isSaving}
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group half">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle">Current Job Title</label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Your current job title"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about yourself"
                rows="4"
                disabled={isSaving}
              ></textarea>
            </div>

            <button
              type="submit"
              className={`btn-primary ${isSaving ? 'loading' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Upload Resume</h2>
        <ResumeUpload />
      </div>

      {resumeData && resumeData.structured && (
        <div className="card">
          <h2>Resume Analysis</h2>
          {resumeData?.provider && (
            <p>Analyzed with: {resumeData.provider}</p>
          )}

          {resumeData ? (
            <>
              <h3>Skills</h3>
              {resumeData.structured?.skills ? (
                <ul>
                  {resumeData.structured.skills.map((skill, idx) => (
                    <li key={idx}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p>Not found</p>
              )}

              <h3>Experience</h3>
              {resumeData.structured?.experience ? (
                <ul>
                  {resumeData.structured.experience.map((exp, idx) => (
                    <li key={idx}>
                      {typeof exp === 'object' ? (
                        <>
                          <strong>{exp.title}</strong> at {exp.company}
                          {exp.duration && <span> ({exp.duration})</span>}
                          {exp.description && <p>{exp.description}</p>}
                        </>
                      ) : (
                        exp
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Not found</p>
              )}

              <h3>Education</h3>
              {resumeData.structured?.education ? (
                <ul>
                  {resumeData.structured.education.map((edu, idx) => (
                    <li key={idx}>
                      {typeof edu === 'object' ? (
                        <>
                          <strong>{edu.degree}</strong> at {edu.institution}
                          {edu.year && <span> ({edu.year})</span>}
                        </>
                      ) : (
                        edu
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Not found</p>
              )}


            </>
          ) : (
            <p>No resume uploaded or parsed yet.</p>
          )}
        </div>
      )}

      <div className="card">
        <h2>Matching Preferences</h2>
        <PreferencesWizard />
      </div>

      <div className="card">
        <h2>Matched Jobs</h2>
        <JobMatches />
      </div>
    </div>
  );
}

export default Profile;