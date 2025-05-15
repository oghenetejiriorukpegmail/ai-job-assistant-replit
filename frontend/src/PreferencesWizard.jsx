// frontend/src/PreferencesWizard.jsx

/**
 * Matching Preferences Wizard component.
 * Allows user to select matching mode and provide job titles.
 * Implements a step-by-step wizard UI.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import { savePreferences as savePrefsToStorage, getPreferences } from './services/storage-service';
import './styles/preferences-wizard.css';

function PreferencesWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState('resume');
  const [jobTitles, setJobTitles] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    setIsLoading(true);
    try {
      try {
        // Try to get from API first
        const data = await apiRequest('/api/preferences');
        if (data) {
          setMode(data.mode || 'resume');
          setJobTitles((data.jobTitles || []).join(', '));
          setIsComplete(true);

          // Save to local storage
          savePrefsToStorage({
            mode: data.mode || 'resume',
            jobTitles: data.jobTitles || []
          });
        }
      } catch (apiErr) {
        // If API fails, load from localStorage
        console.log('Loading preferences from local storage');
        const localPrefs = getPreferences();
        if (localPrefs) {
          setMode(localPrefs.mode || 'resume');
          setJobTitles((localPrefs.jobTitles || []).join(', '));
          setIsComplete(true);
        }
      }
    } catch (err) {
      // ignore if not set
      console.log('No preferences found or error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function savePreferences() {
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const payload = { mode };
      if (mode === 'titles') {
        const titles = jobTitles.split(',').map(t => t.trim()).filter(Boolean);

        if (titles.length === 0) {
          setError('Please enter at least one job title');
          setIsSaving(false);
          return;
        }

        payload.jobTitles = titles;
      }

      try {
        // Try to save to API
        await apiRequest('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (apiErr) {
        console.log('API save failed, saving to local storage only');
      }

      // Save to local storage regardless of API success
      savePrefsToStorage(payload);
      setMessage('Preferences saved successfully!');
      setIsComplete(true);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle next step in wizard
  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (mode === 'titles' && !jobTitles.trim()) {
        setError('Please enter at least one job title');
        return;
      }
      savePreferences();
    }
  };

  // Handle back step in wizard
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep(1);
    setIsComplete(false);
    setMessage('');
  };

  return (
    <div className="preferences-wizard">
      {isLoading ? (
        <div className="loading-spinner">Loading preferences...</div>
      ) : (
        <>
          <h3>Matching Preferences Wizard</h3>
          <p className="preferences-description">
            Set up how you want job matches to be determined
          </p>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          {/* Wizard Steps */}
          <div className="wizard-steps">
            <div className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 || isComplete ? 'completed' : ''}`}>
              <div className="step-number">{currentStep > 1 || isComplete ? '✓' : '1'}</div>
              <div className="step-title">Choose Matching Method</div>
            </div>
            <div className={`wizard-step ${currentStep === 2 ? 'active' : ''} ${isComplete ? 'completed' : ''}`}>
              <div className="step-number">{isComplete ? '✓' : '2'}</div>
              <div className="step-title">{mode === 'resume' ? 'Confirm Resume Matching' : 'Enter Job Titles'}</div>
            </div>
            <div className={`wizard-step ${isComplete ? 'completed' : ''}`}>
              <div className="step-number">{isComplete ? '✓' : '3'}</div>
              <div className="step-title">Complete</div>
            </div>
          </div>

          {/* Wizard Content */}
          <div className="wizard-content">
            {isComplete ? (
              <div className="wizard-complete">
                <h4>Your matching preferences have been saved!</h4>
                <p>
                  {mode === 'resume'
                    ? 'We will match jobs based on your uploaded resume content.'
                    : `We will match jobs based on these job titles: ${jobTitles}`
                  }
                </p>
                <button onClick={handleReset} className="btn-primary">
                  Update Preferences
                </button>
              </div>
            ) : currentStep === 1 ? (
              <div className="preference-options">
                <label className={`radio-option ${mode === 'resume' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="resume"
                    checked={mode === 'resume'}
                    onChange={() => setMode('resume')}
                    disabled={isSaving}
                  />
                  <div className="option-content">
                    <span className="option-title">Match based on uploaded resume</span>
                    <span className="option-description">We'll analyze your resume to find the best job matches</span>
                  </div>
                </label>

                <label className={`radio-option ${mode === 'titles' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="titles"
                    checked={mode === 'titles'}
                    onChange={() => setMode('titles')}
                    disabled={isSaving}
                  />
                  <div className="option-content">
                    <span className="option-title">Match based on job titles</span>
                    <span className="option-description">Specify job titles you're interested in</span>
                  </div>
                </label>
              </div>
            ) : currentStep === 2 ? (
              <div>
                {mode === 'resume' ? (
                  <div className="resume-confirmation">
                    <p>We will match jobs based on the skills and experience in your uploaded resume.</p>
                    <p>This provides the most accurate matches tailored to your specific background.</p>
                  </div>
                ) : (
                  <div className="job-titles-input">
                    <label htmlFor="jobTitles">Job Titles</label>
                    <textarea
                      id="jobTitles"
                      placeholder="Enter job titles, separated by commas (e.g. Software Engineer, Product Manager)"
                      value={jobTitles}
                      onChange={(e) => setJobTitles(e.target.value)}
                      rows="3"
                      disabled={isSaving}
                    />
                    <p className="input-help">Enter multiple job titles separated by commas</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Wizard Navigation */}
          {!isComplete && (
            <div className="wizard-navigation">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="btn-back"
                  disabled={isSaving}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className={currentStep === 2 ? 'btn-finish' : 'btn-next'}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : currentStep === 2 ? 'Finish' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PreferencesWizard;