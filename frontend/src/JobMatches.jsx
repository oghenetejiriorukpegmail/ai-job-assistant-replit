// frontend/src/JobMatches.jsx

/**
 * Job Matches component.
 * Fetches and displays matched jobs from backend.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { apiRequest } from './api';
import { saveJobs, getSavedJobs } from './services/storage-service';
import './styles/components/job-card.css';

const JobMatches = forwardRef((props, ref) => {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    setError('');

    try {
      try {
        // Try to get from API first
        const data = await apiRequest('/api/jobs/match');
        if (data && Array.isArray(data)) {
          setJobs(data);
          // Save to local storage
          saveJobs(data);
        } else {
          // If no data or not an array, try localStorage
          const savedJobs = getSavedJobs();
          if (savedJobs && savedJobs.length > 0) {
            setJobs(savedJobs);
          } else {
            setJobs([]);
          }
        }
      } catch (apiErr) {
        // If API fails, load from localStorage
        console.log('Loading jobs from local storage');
        const savedJobs = getSavedJobs();
        if (savedJobs && savedJobs.length > 0) {
          setJobs(savedJobs);
        } else {
          setJobs([]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Expose fetchJobs method to parent component
  useImperativeHandle(ref, () => ({
    fetchJobs
  }));

  return (
    <div className="job-matches">
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-circle-notch fa-spin"></i>
          </div>
          <p>Loading job matches...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="no-jobs">
          <p>No jobs found. Try updating your preferences or uploading a resume.</p>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => (
            <div className="job-card" key={job.id}>
              <div className="job-header">
                <h4 className="job-title">{job.title}</h4>
                <span className="job-company">{job.company}</span>
                {job.source && <span className="source-badge">{job.source}</span>}
              </div>

              <div className="job-details">
                <p className="job-description">{job.description}</p>

                <div className="job-meta">
                  <span className="job-location">
                    <i className="fas fa-map-marker-alt"></i> {job.location}
                  </span>

                  {job.score !== undefined && (
                    <span className="job-match">
                      <i className="fas fa-percentage"></i> {job.score}% match
                    </span>
                  )}
                </div>

                {job.skills && job.skills.length > 0 && (
                  <div className="job-skills">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="job-actions">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-apply"
                >
                  Apply Now
                </a>
                <button className="btn-save">
                  <i className="far fa-bookmark"></i> Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .loading-spinner {
          font-size: 2rem;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
});

export default JobMatches;