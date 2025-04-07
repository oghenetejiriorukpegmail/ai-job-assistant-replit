// frontend/src/api.js

/**
 * API service layer for Job Application SaaS frontend.
 * Handles all HTTP requests to backend with JWT support.
 * 
 * Security-first approach:
 * - JWT stored in memory (avoid localStorage for XSS)
 * - Attach JWT in Authorization header
 * - Handle errors gracefully
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

const API_BASE_URL = 'http://localhost:5000';

let jwtToken = null;

/**
 * Set JWT token after login
 * @param {string} token 
 */
export function setToken(token) {
  jwtToken = token;
  window.jwtToken = token; // expose for fetch fallback
}

/**
 * Clear JWT token on logout
 */
export function clearToken() {
  jwtToken = null;
  window.jwtToken = null;
}

/**
 * Make an authenticated API request
 * @param {string} url 
 * @param {object} options 
 * @returns {Promise<Response>}
 */
export async function apiRequest(url, options = {}) {
  const headers = options.headers || {};

  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
}