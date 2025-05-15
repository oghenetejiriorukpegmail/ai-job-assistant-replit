// frontend/src/Auth.jsx

/**
 * Authentication component for Job Application SaaS frontend.
 * Provides Register and Login forms.
 *
 * Security-first approach:
 * - JWT stored in memory (via api.js)
 * - Input validation
 * - Error handling
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import { apiRequest, setToken } from './api';
import { initializeAllData } from './services/storage-service';

function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    if (strength === 0) return '';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength === 0) return '';
    if (strength === 1) return '#ef4444';
    if (strength === 2) return '#f59e0b';
    if (strength === 3) return '#10b981';
    return '#10b981';
  };

  const passwordStrength = checkPasswordStrength(password);
  const strengthText = getPasswordStrengthText(passwordStrength);
  const strengthColor = getPasswordStrengthColor(passwordStrength);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate inputs
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const userData = isRegister ? { email, password, name } : { email, password };

      const data = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!isRegister) {
        setToken(data.token);

        // Initialize all data from localStorage after login
        initializeAllData();

        onAuthSuccess();
      } else {
        setMessage('Registration successful! Please log in.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? 'Create an Account' : 'Welcome Back'}</h2>
        <p className="auth-subtitle">
          {isRegister ? 'Fill in your details to get started' : 'Enter your credentials to continue'}
        </p>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={isRegister ? 'Create a secure password' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {isRegister && password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-indicator"
                    style={{
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: strengthColor
                    }}
                  ></div>
                </div>
                <span style={{ color: strengthColor }}>{strengthText}</span>
              </div>
            )}
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary auth-button">
            {isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isRegister
              ? 'Already have an account?'
              : 'Don\'t have an account?'}
            <button
              onClick={toggleMode}
              className="toggle-button"
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;