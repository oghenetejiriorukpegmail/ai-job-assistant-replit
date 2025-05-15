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

// JWT token stored only in memory (no persistence)
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

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    throw new Error('Unauthorized. Please log in again.');
  }
  
  // Handle common 404 errors for endpoints that might not exist yet
  if (response.status === 404) {
    console.log(`Endpoint not found: ${url}`);
    if (url.includes('/api/preferences') ||
        url.includes('/api/resumes/user') ||
        url.includes('/api/jobs/match') ||
        url.includes('/api/users/profile') ||
        url.includes('/api/jobs/crawl') ||
        url.includes('/api/jobs/schedule')) {
      // Return empty data instead of error for these endpoints
      return [];
    }
  }

  // Handle 400 errors which might be due to missing data or invalid parameters
  if (response.status === 400) {
    console.log(`Bad request for: ${url}`);
    if (url.includes('/api/resumes/user') ||
        url.includes('/api/preferences') ||
        url.includes('/api/jobs/crawl/status') ||
        url.includes('/api/jobs/schedule/cancel')) {
      // Return empty data instead of error
      return null;
    }
  }

  // Handle 403 errors which might be due to permission issues
  if (response.status === 403) {
    console.log(`Forbidden access for: ${url}`);
    if (url.includes('/api/jobs/crawl') ||
        url.includes('/api/jobs/schedule')) {
      throw new Error('You do not have permission to access this resource. Admin access required.');
    }
  }

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    } catch (jsonError) {
      // If we can't parse the error as JSON
      throw new Error(`API request failed with status ${response.status}`);
    }
  }

  return response.json();
}