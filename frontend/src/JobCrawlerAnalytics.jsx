// frontend/src/JobCrawlerAnalytics.jsx

/**
 * Job Crawler Analytics component.
 * Provides visualizations and statistics for job crawls.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import './styles/job-crawler-analytics.css';

function JobCrawlerAnalytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await apiRequest('/api/jobs/stats');
      setStats(data);
    } catch (err) {
      setError('Failed to fetch crawl statistics. Please try again.');
      console.error('Fetch stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };
  
  const calculatePercentage = (part, total) => {
    if (!part || !total) return 0;
    return Math.round((part / total) * 100);
  };
  
  const renderTotalStats = () => {
    if (!stats || !stats.total) return null;
    
    const { totalJobs, savedJobs, duplicateJobs, errorJobs, count, avgDuration } = stats.total;
    
    return (
      <div className="stats-card total-stats">
        <h3>Total Crawl Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{formatNumber(count)}</div>
            <div className="stat-label">Crawls Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(totalJobs)}</div>
            <div className="stat-label">Jobs Found</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(savedJobs)}</div>
            <div className="stat-label">Jobs Saved</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(duplicateJobs)}</div>
            <div className="stat-label">Duplicates</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatNumber(errorJobs)}</div>
            <div className="stat-label">Errors</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{avgDuration ? Math.round(avgDuration / 1000) : 0}s</div>
            <div className="stat-label">Avg Duration</div>
          </div>
        </div>
        
        <div className="stats-chart">
          <h4>Job Processing Results</h4>
          <div className="progress-bar">
            <div 
              className="progress-segment saved" 
              style={{ width: `${calculatePercentage(savedJobs, totalJobs)}%` }}
              title={`${formatNumber(savedJobs)} jobs saved (${calculatePercentage(savedJobs, totalJobs)}%)`}
            ></div>
            <div 
              className="progress-segment duplicate" 
              style={{ width: `${calculatePercentage(duplicateJobs, totalJobs)}%` }}
              title={`${formatNumber(duplicateJobs)} duplicates (${calculatePercentage(duplicateJobs, totalJobs)}%)`}
            ></div>
            <div 
              className="progress-segment error" 
              style={{ width: `${calculatePercentage(errorJobs, totalJobs)}%` }}
              title={`${formatNumber(errorJobs)} errors (${calculatePercentage(errorJobs, totalJobs)}%)`}
            ></div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color saved"></span>
              <span className="legend-label">Saved ({calculatePercentage(savedJobs, totalJobs)}%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color duplicate"></span>
              <span className="legend-label">Duplicates ({calculatePercentage(duplicateJobs, totalJobs)}%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color error"></span>
              <span className="legend-label">Errors ({calculatePercentage(errorJobs, totalJobs)}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSourceStats = () => {
    if (!stats || !stats.bySource || !stats.bySource.length) return null;
    
    return (
      <div className="stats-card source-stats">
        <h3>Statistics by Source</h3>
        <div className="source-table">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Crawls</th>
                <th>Jobs Found</th>
                <th>Jobs Saved</th>
                <th>Duplicates</th>
                <th>Errors</th>
                <th>Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {stats.bySource.map(source => (
                <tr key={source._id}>
                  <td className="source-name">{source._id || 'Unknown'}</td>
                  <td>{formatNumber(source.count)}</td>
                  <td>{formatNumber(source.totalJobs)}</td>
                  <td>{formatNumber(source.savedJobs)}</td>
                  <td>{formatNumber(source.duplicateJobs)}</td>
                  <td>{formatNumber(source.errorJobs)}</td>
                  <td>{source.avgDuration ? Math.round(source.avgDuration / 1000) : 0}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="source-chart">
          <h4>Jobs Found by Source</h4>
          <div className="bar-chart">
            {stats.bySource.map(source => {
              const percentage = calculatePercentage(source.totalJobs, stats.total.totalJobs);
              return (
                <div className="bar-container" key={source._id}>
                  <div className="bar-label">{source._id || 'Unknown'}</div>
                  <div className="bar">
                    <div 
                      className="bar-value" 
                      style={{ width: `${percentage}%` }}
                      title={`${formatNumber(source.totalJobs)} jobs (${percentage}%)`}
                    ></div>
                  </div>
                  <div className="bar-percentage">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="job-crawler-analytics">
      <h2>Job Crawler Analytics</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading-spinner">Loading statistics...</div>
      ) : (
        <>
          {stats ? (
            <div className="analytics-content">
              {renderTotalStats()}
              {renderSourceStats()}
            </div>
          ) : (
            <div className="no-data">No statistics available. Run some job crawls to generate data.</div>
          )}
          
          <div className="refresh-button">
            <button onClick={fetchStats} className="btn-refresh">
              Refresh Statistics
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default JobCrawlerAnalytics;
