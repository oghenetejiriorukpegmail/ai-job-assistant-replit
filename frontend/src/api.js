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

let jwtToken = null;

/**
 * Set JWT token after login
 * @param {string} token 
 */
export function setToken(token) {
  jwtToken = token;
}

/**
 * Clear JWT token on logout
 */
export function clearToken() {
  jwtToken = null;
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }

  return response.json();
}