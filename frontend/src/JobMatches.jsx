// frontend/src/JobMatches.jsx

/**
 * Job Matches component.
 * Fetches and displays matched jobs from backend.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';

function JobMatches() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const data = await apiRequest('/api/jobs/match');
      setJobs(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h3>Matched Jobs</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <ul>
          {jobs.map(job => (
            <li key={job.id}>
              <strong>{job.title}</strong> at {job.company}<br/>
              {job.description}<br/>
              Location: {job.location}<br/>
              <a href={job.url} target="_blank" rel="noopener noreferrer">View Job</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default JobMatches;