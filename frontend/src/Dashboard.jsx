// frontend/src/Dashboard.jsx

/**
 * Dashboard component.
 * Displays welcome message, quick stats, and recent jobs.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React from 'react';
import JobMatches from './JobMatches';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <div className="card card-accent">
          <div className="card-header">
            <h2 className="card-title">Welcome Back!</h2>
          </div>
          <div className="card-body">
            <p>Manage your profile, upload resumes, and find your next job opportunity.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card card-interactive">
          <div className="card-header">
            <h2 className="card-title">Quick Stats</h2>
          </div>
          <div className="card-body">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">📄</div>
                <div className="stat-value">3</div>
                <div className="stat-label">Resumes Uploaded</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">5</div>
                <div className="stat-label">Preferences Saved</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🔍</div>
                <div className="stat-value">12</div>
                <div className="stat-label">Jobs Matched</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Job Matches</h2>
          </div>
          <div className="card-body">
            <JobMatches />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;