// frontend/src/JobCrawlerDashboard.jsx

/**
 * Job Crawler Dashboard component.
 * Provides UI for managing job crawls and viewing results.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import AdvancedScheduleForm from './components/AdvancedScheduleForm';
import ExportDataForm from './components/ExportDataForm';
import './styles/job-crawler-dashboard.css';

function JobCrawlerDashboard() {
  const [activeCrawls, setActiveCrawls] = useState([]);
  const [scheduledCrawls, setScheduledCrawls] = useState([]);
  const [crawlHistory, setCrawlHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // New crawl form state
  const [newCrawl, setNewCrawl] = useState({
    source: 'all',
    keywords: '',
    location: '',
    limit: 20,
    saveJobs: true
  });

  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    source: 'all',
    keywords: '',
    location: '',
    limit: 20,
    intervalMinutes: 1440, // 24 hours
    schedule: null, // Advanced schedule options
    name: ''
  });

  // Tabs state
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchCrawlData();
    // Set up polling for active crawls
    const interval = setInterval(() => {
      if (activeTab === 'active') {
        fetchActiveCrawls();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchCrawlData = async () => {
    setIsLoading(true);
    setError('');

    try {
      await Promise.all([
        fetchActiveCrawls(),
        fetchScheduledCrawls(),
        fetchCrawlHistory()
      ]);
    } catch (err) {
      setError('Failed to fetch crawl data. Please try again.');
      console.error('Fetch crawl data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveCrawls = async () => {
    try {
      const data = await apiRequest('/api/jobs/crawl/active');
      setActiveCrawls(data || []);
    } catch (err) {
      console.error('Fetch active crawls error:', err);
      // Set empty array to prevent UI errors
      setActiveCrawls([]);
    }
  };

  const fetchScheduledCrawls = async () => {
    try {
      const data = await apiRequest('/api/jobs/schedule/list');
      setScheduledCrawls(data || []);
    } catch (err) {
      console.error('Fetch scheduled crawls error:', err);
      // Set empty array to prevent UI errors
      setScheduledCrawls([]);
    }
  };

  const fetchCrawlHistory = async () => {
    try {
      const data = await apiRequest('/api/jobs/crawl/history');
      setCrawlHistory(data || []);
    } catch (err) {
      console.error('Fetch crawl history error:', err);
      // Set empty array to prevent UI errors
      setCrawlHistory([]);
    }
  };

  const handleNewCrawlChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCrawl({
      ...newCrawl,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNewScheduleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const startCrawl = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        source: newCrawl.source,
        searchParams: {
          keywords: newCrawl.keywords,
          location: newCrawl.location,
          limit: parseInt(newCrawl.limit)
        },
        saveJobs: newCrawl.saveJobs
      };

      const result = await apiRequest('/api/jobs/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setMessage(`Crawl started successfully! ID: ${result.id}`);
      fetchActiveCrawls();

      // Reset form
      setNewCrawl({
        source: 'all',
        keywords: '',
        location: '',
        limit: 20,
        saveJobs: true
      });
    } catch (err) {
      setError('Failed to start crawl. Please try again.');
      console.error('Start crawl error:', err);
    }
  };

  const scheduleRecurringCrawl = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        source: newSchedule.source,
        searchParams: {
          keywords: newSchedule.keywords,
          location: newSchedule.location,
          limit: parseInt(newSchedule.limit)
        },
        intervalMinutes: parseInt(newSchedule.intervalMinutes),
        name: newSchedule.name || `${newSchedule.source} Job Crawl`,
        schedule: newSchedule.schedule
      };

      const result = await apiRequest('/api/jobs/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setMessage(`Crawl scheduled successfully! ID: ${result.id}`);
      fetchScheduledCrawls();

      // Reset form
      setNewSchedule({
        source: 'all',
        keywords: '',
        location: '',
        limit: 20,
        intervalMinutes: 1440,
        schedule: null,
        name: ''
      });
    } catch (err) {
      setError('Failed to schedule crawl. Please try again.');
      console.error('Schedule crawl error:', err);
    }
  };

  const cancelScheduledCrawl = async (id) => {
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/jobs/schedule/cancel/${id}`, {
        method: 'DELETE'
      });

      setMessage('Scheduled crawl cancelled successfully!');
      fetchScheduledCrawls();
    } catch (err) {
      setError('Failed to cancel scheduled crawl. Please try again.');
      console.error('Cancel scheduled crawl error:', err);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatInterval = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return '1 hour';
    if (minutes < 1440) return `${minutes / 60} hours`;
    if (minutes === 1440) return '1 day';
    return `${minutes / 1440} days`;
  };

  const renderActiveCrawls = () => {
    if (activeCrawls.length === 0) {
      return <p className="no-data">No active crawls.</p>;
    }

    return (
      <div className="crawl-list">
        {activeCrawls.map(crawl => (
          <div key={crawl.id} className="crawl-item">
            <div className="crawl-header">
              <h4>Crawl ID: {crawl.id}</h4>
              <span className={`status-badge ${crawl.status}`}>{crawl.status}</span>
            </div>
            <div className="crawl-details">
              <p><strong>Source:</strong> {crawl.source}</p>
              <p><strong>Started:</strong> {formatDateTime(crawl.startTime)}</p>
              {crawl.endTime && (
                <p><strong>Ended:</strong> {formatDateTime(crawl.endTime)}</p>
              )}
              {crawl.result && (
                <div className="crawl-result">
                  <p><strong>Results:</strong></p>
                  <ul>
                    <li>Total: {crawl.result.total}</li>
                    <li>Saved: {crawl.result.saved}</li>
                    <li>Duplicates: {crawl.result.duplicates}</li>
                    <li>Errors: {crawl.result.errors}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderScheduledCrawls = () => {
    if (scheduledCrawls.length === 0) {
      return <p className="no-data">No scheduled crawls.</p>;
    }

    return (
      <div className="crawl-list">
        {scheduledCrawls.map(schedule => (
          <div key={schedule.id} className="crawl-item">
            <div className="crawl-header">
              <h4>Schedule ID: {schedule.id}</h4>
              <span className={`status-badge ${schedule.status}`}>{schedule.status}</span>
            </div>
            <div className="crawl-details">
              {schedule.name && <p><strong>Name:</strong> {schedule.name}</p>}
              <p><strong>Source:</strong> {schedule.source}</p>

              {schedule.schedule && schedule.schedule.type === 'advanced' ? (
                <>
                  <p><strong>Schedule:</strong> Advanced</p>
                  <p><strong>Days:</strong> {schedule.schedule.days.map(day => [
                    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
                  ][day]).join(', ')}</p>
                  <p><strong>Times:</strong> {schedule.schedule.times.join(', ')}</p>
                  <p><strong>Timezone:</strong> {schedule.schedule.timezone}</p>
                </>
              ) : (
                <p><strong>Interval:</strong> {formatInterval(schedule.intervalMinutes)}</p>
              )}

              <p><strong>Last Run:</strong> {formatDateTime(schedule.lastRun)}</p>
              <p><strong>Next Run:</strong> {formatDateTime(schedule.nextRun)}</p>
              <button
                onClick={() => cancelScheduledCrawl(schedule.id)}
                className="btn-cancel"
              >
                Cancel Schedule
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCrawlHistory = () => {
    if (crawlHistory.length === 0) {
      return <p className="no-data">No crawl history available.</p>;
    }

    return (
      <div className="crawl-list">
        {crawlHistory.map(crawl => (
          <div key={crawl.id} className="crawl-item">
            <div className="crawl-header">
              <h4>Crawl ID: {crawl.id}</h4>
              <span className={`status-badge ${crawl.status}`}>{crawl.status}</span>
            </div>
            <div className="crawl-details">
              <p><strong>Source:</strong> {crawl.source}</p>
              <p><strong>Started:</strong> {formatDateTime(crawl.startTime)}</p>
              <p><strong>Ended:</strong> {formatDateTime(crawl.endTime)}</p>
              {crawl.result && (
                <div className="crawl-result">
                  <p><strong>Results:</strong></p>
                  <ul>
                    <li>Total: {crawl.result.total}</li>
                    <li>Saved: {crawl.result.saved}</li>
                    <li>Duplicates: {crawl.result.duplicates}</li>
                    <li>Errors: {crawl.result.errors}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNewCrawlForm = () => {
    return (
      <div className="form-container">
        <h3>Start New Crawl</h3>
        <form onSubmit={startCrawl}>
          <div className="form-group">
            <label htmlFor="source">Source</label>
            <select
              id="source"
              name="source"
              value={newCrawl.source}
              onChange={handleNewCrawlChange}
              required
            >
              <option value="all">All Sources</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="glassdoor">Glassdoor</option>
              <option value="googleJobs">Google Jobs</option>
              <option value="remotive">Remotive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="keywords">Keywords</label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={newCrawl.keywords}
              onChange={handleNewCrawlChange}
              placeholder="e.g. Software Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={newCrawl.location}
              onChange={handleNewCrawlChange}
              placeholder="e.g. Remote, New York, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="limit">Result Limit</label>
            <input
              type="number"
              id="limit"
              name="limit"
              value={newCrawl.limit}
              onChange={handleNewCrawlChange}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="saveJobs"
              name="saveJobs"
              checked={newCrawl.saveJobs}
              onChange={handleNewCrawlChange}
            />
            <label htmlFor="saveJobs">Save jobs to database</label>
          </div>

          <button type="submit" className="btn-primary">Start Crawl</button>
        </form>
      </div>
    );
  };

  // Handle advanced schedule change
  const handleScheduleChange = (schedule) => {
    setNewSchedule(prev => ({
      ...prev,
      schedule
    }));
  };

  const renderScheduleForm = () => {
    return (
      <div className="form-container">
        <h3>Schedule Recurring Crawl</h3>
        <form onSubmit={scheduleRecurringCrawl}>
          <div className="form-group">
            <label htmlFor="scheduleName">Schedule Name</label>
            <input
              type="text"
              id="scheduleName"
              name="name"
              value={newSchedule.name}
              onChange={handleNewScheduleChange}
              placeholder="e.g. Daily Software Engineer Jobs"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduleSource">Source</label>
            <select
              id="scheduleSource"
              name="source"
              value={newSchedule.source}
              onChange={handleNewScheduleChange}
              required
            >
              <option value="all">All Sources</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="glassdoor">Glassdoor</option>
              <option value="googleJobs">Google Jobs</option>
              <option value="remotive">Remotive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scheduleKeywords">Keywords</label>
            <input
              type="text"
              id="scheduleKeywords"
              name="keywords"
              value={newSchedule.keywords}
              onChange={handleNewScheduleChange}
              placeholder="e.g. Software Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduleLocation">Location</label>
            <input
              type="text"
              id="scheduleLocation"
              name="location"
              value={newSchedule.location}
              onChange={handleNewScheduleChange}
              placeholder="e.g. Remote, New York, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduleLimit">Result Limit</label>
            <input
              type="number"
              id="scheduleLimit"
              name="limit"
              value={newSchedule.limit}
              onChange={handleNewScheduleChange}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Schedule Type</label>
            <AdvancedScheduleForm
              onScheduleChange={handleScheduleChange}
              initialSchedule={newSchedule.schedule}
            />
          </div>

          {!newSchedule.schedule && (
            <div className="form-group">
              <label htmlFor="intervalMinutes">Interval</label>
              <select
                id="intervalMinutes"
                name="intervalMinutes"
                value={newSchedule.intervalMinutes}
                onChange={handleNewScheduleChange}
                required
              >
                <option value="60">Every hour</option>
                <option value="360">Every 6 hours</option>
                <option value="720">Every 12 hours</option>
                <option value="1440">Every day</option>
                <option value="10080">Every week</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary">Schedule Crawl</button>
        </form>
      </div>
    );
  };

  return (
    <div className="job-crawler-dashboard">
      <h2>Job Crawler Dashboard</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Crawls
        </button>
        <button
          className={`tab-button ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Crawls
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Crawl History
        </button>
        <button
          className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New Crawl
        </button>
        <button
          className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule Crawl
        </button>
        <button
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export Data
        </button>
      </div>

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {activeTab === 'active' && (
              <div className="tab-content">
                <h3>Active Crawls</h3>
                {renderActiveCrawls()}
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div className="tab-content">
                <h3>Scheduled Crawls</h3>
                {renderScheduledCrawls()}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-content">
                <h3>Crawl History</h3>
                {renderCrawlHistory()}
              </div>
            )}

            {activeTab === 'new' && (
              <div className="tab-content">
                {renderNewCrawlForm()}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="tab-content">
                {renderScheduleForm()}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="tab-content">
                <ExportDataForm />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default JobCrawlerDashboard;
