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

function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const data = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!isRegister) {
        setToken(data.token);
        onAuthSuccess();
      } else {
        setIsRegister(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={toggleMode}>
        {isRegister ? 'Already have an account? Login' : 'No account? Register'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Auth;