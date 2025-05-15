// frontend/src/Jobs.jsx

/**
 * Jobs page component.
 * Displays matched jobs.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useRef, useState } from 'react';
import JobMatches from './JobMatches';

function Jobs() {
  const jobMatchesRef = useRef();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (jobMatchesRef.current && jobMatchesRef.current.fetchJobs) {
      setRefreshing(true);
      jobMatchesRef.current.fetchJobs();

      // Reset refreshing state after animation
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  return (
    <div className="jobs-container">
      <div className="card jobs-card">
        <div className="card-header">
          <h2>Recent Job Matches</h2>
          <div className="card-actions">
            <button
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              title="Refresh job matches"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <JobMatches ref={jobMatchesRef} />
      </div>

      <style jsx>{`
        .jobs-container {
          margin-bottom: 2rem;
        }

        .jobs-card {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.5rem 0;
          margin-bottom: 1rem;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .refresh-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background-color: var(--hover-color);
          color: var(--primary-color);
        }

        .refresh-btn.refreshing i {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Jobs;