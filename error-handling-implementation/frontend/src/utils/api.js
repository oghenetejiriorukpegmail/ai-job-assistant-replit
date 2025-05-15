/**
 * Enhanced API Client
 *
 * This module provides a robust API client for making HTTP requests to the backend.
 * It includes error handling, retry logic, and authentication support.
 */

import { showErrorToast } from '../components/errors/ToastContainer';

// API configuration
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 2,
  RETRY_DELAY: 1000, // 1 second
};

// JWT token stored only in memory (no persistence)
let jwtToken = null;

/**
 * Set JWT token after login
 * @param {string} token - JWT token
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
 * Get JWT token
 * @returns {string|null} - JWT token
 */
export function getToken() {
  return jwtToken;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(message, status, code, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'API_ERROR';
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Check if a request should be retried
 * @param {Error} error - Error object
 * @returns {boolean} - Whether the request should be retried
 */
function isRetryable(error) {
  // Network errors are usually transient
  if (error.name === 'TypeError' && error.message.includes('Network')) {
    return true;
  }

  // Retry on timeout
  if (error.name === 'TimeoutError') {
    return true;
  }

  // Retry on 429 (Too Many Requests) and 5xx errors
  if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
    return true;
  }

  return false;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>} - Promise that resolves after the duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an API request with retry logic
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 * @throws {ApiError} - If the request fails
 */
export async function apiRequest(url, options = {}) {
  const headers = options.headers || {};
  let retries = 0;
  const maxRetries = options.retries || API_CONFIG.RETRY_COUNT;

  // Add authorization header if token exists
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  // Add content type if not specified
  if (!headers['Content-Type'] && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  // Add request ID for tracking
  headers['X-Request-ID'] = generateRequestId();

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, options.timeout || API_CONFIG.TIMEOUT);

  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers,
    signal: controller.signal,
  };

  while (true) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, fetchOptions);
      
      // Clear timeout
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized (token expired)
      if (response.status === 401) {
        clearToken();
        throw new ApiError('Your session has expired. Please log in again.', 401, 'UNAUTHORIZED');
      }

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage = data.message || `Request failed with status ${response.status}`;
        const errorCode = data.code || 'API_ERROR';
        throw new ApiError(errorMessage, response.status, errorCode, data);
      }

      return data;
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);

      // Handle aborted requests (timeout)
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408, 'TIMEOUT');
      }

      // Check if we should retry
      if (retries < maxRetries && isRetryable(error)) {
        retries++;
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retries - 1);
        console.warn(`API request failed, retrying (${retries}/${maxRetries}) after ${delay}ms`, error);
        await sleep(delay);
        continue;
      }

      // Enhance error with additional context
      if (!(error instanceof ApiError)) {
        error = new ApiError(
          error.message || 'An unexpected error occurred',
          error.status || 500,
          error.code || 'UNKNOWN_ERROR',
          { originalError: error.toString() }
        );
      }

      // Show error toast for user feedback
      showErrorToast(getUserFriendlyErrorMessage(error));

      throw error;
    }
  }
}

/**
 * Generate a request ID for tracking
 * @returns {string} - Unique request ID
 */
function generateRequestId() {
  return `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Get a user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  // Handle specific error codes
  switch (error.code) {
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please log in again.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'NOT_FOUND_ERROR':
      return 'The requested resource could not be found.';
    case 'TIMEOUT':
      return 'The request timed out. Please try again later.';
    default:
      // Use error message if it's user-friendly, otherwise use generic message
      return error.message || 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Shorthand for GET requests
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function get(url, options = {}) {
  return apiRequest(url, { ...options, method: 'GET' });
}

/**
 * Shorthand for POST requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function post(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Shorthand for PUT requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function put(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Shorthand for DELETE requests
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export function del(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' });
}

export default {
  get,
  post,
  put,
  del,
  setToken,
  clearToken,
  getToken,
  ApiError,
};