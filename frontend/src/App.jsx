// frontend/src/App.jsx

/**
 * Main frontend app component with header, sidebar, and content.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Profile from './Profile';
import Dashboard from './Dashboard';
import Jobs from './Jobs';
import Settings from './Settings';
import JobCrawlerDashboard from './JobCrawlerDashboard';
import JobCrawlerAnalytics from './JobCrawlerAnalytics';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { clearToken } from './api';
import { initializeAllData, saveAllData } from './services/storage-service';
import './styles/theme.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Set up periodic save every 30 seconds after login
  useEffect(() => {
    if (isAuthenticated) {
      initializeAllData();
      const saveInterval = setInterval(() => {
        saveAllData();
      }, 30000);
      return () => clearInterval(saveInterval);
    }
  }, [isAuthenticated]);

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);

    // Pre-load all data from localStorage after login
    initializeAllData();
  };


  const handleLogout = () => {
    // Save all data before logout
    const data = initializeAllData();
    saveAllData(data);

    clearToken();
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <header className={scrolled ? 'scrolled' : ''}>
          <h1>Job Application Portal</h1>
          <div className="header-right">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="nav-links">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                <Link to="/jobs" className="nav-link">Jobs</Link>
                <Link to="/crawler" className="nav-link">Job Crawler</Link>
                <Link to="/settings" className="nav-link">Settings</Link>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <div className="nav-links">
                <Link to="/login" className="nav-link active">Login</Link>
              </div>
            )}
          </div>
        </header>
        <div className="app-container">
          {isAuthenticated && (
            <nav className="sidebar">
              <div className="sidebar-header">
                <h3>Menu</h3>
              </div>
              <Link to="/dashboard" className="sidebar-link">
                <span className="sidebar-icon">📊</span> Dashboard
              </Link>
              <Link to="/profile" className="sidebar-link">
                <span className="sidebar-icon">👤</span> Profile
              </Link>
              <Link to="/jobs" className="sidebar-link">
                <span className="sidebar-icon">💼</span> Jobs
              </Link>
              <Link to="/crawler" className="sidebar-link">
                <span className="sidebar-icon">🔍</span> Job Crawler
              </Link>
              <Link to="/analytics" className="sidebar-link">
                <span className="sidebar-icon">📈</span> Analytics
              </Link>
              <Link to="/settings" className="sidebar-link">
                <span className="sidebar-icon">⚙️</span> Settings
              </Link>
            </nav>
          )}
          <main className="main-content">
            <Routes>
              {!isAuthenticated && (
                <>
                  <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </>
              )}
              {isAuthenticated && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/crawler" element={<JobCrawlerDashboard />} />
                  <Route path="/analytics" element={<JobCrawlerAnalytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>Job Application Portal</h3>
              <p className="footer-tagline">Streamline your job search process</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Resources</h4>
                <a href="#">Help Center</a>
                <a href="#">Blog</a>
                <a href="#">Tutorials</a>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Job Application Portal. All rights reserved.</p>
          </div>
        </footer>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
