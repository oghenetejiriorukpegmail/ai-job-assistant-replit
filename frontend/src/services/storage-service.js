/**
 * Storage service for persisting data locally until database integration
 * Provides methods for storing and retrieving data from localStorage
 */

// Keys for different data types
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  RESUMES: 'user_resumes',
  SETTINGS: 'app_settings',
  JOBS: 'saved_jobs',
  PREFERENCES: 'user_preferences'
};

/**
 * Save data to localStorage with the specified key
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 */
export const saveData = (key, data) => {
  // Don't save null or undefined data
  if (data === null || data === undefined) {
    console.warn(`Attempted to save null/undefined data for key ${key}`);
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    return false;
  }
};

/**
 * Get data from localStorage by key
 * @param {string} key - Storage key
 * @returns {any} - Parsed data or null if not found
 */
export const getData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return null;
  }
};

/**
 * Save user profile data
 * @param {Object} profileData - User profile data
 */
export const saveUserProfile = (profileData) => {
  return saveData(STORAGE_KEYS.USER_PROFILE, profileData);
};

/**
 * Get user profile data
 * @returns {Object} - User profile data
 */
export const getUserProfile = () => {
  return getData(STORAGE_KEYS.USER_PROFILE) || {
    email: '',
    name: '',
    phone: '',
    location: '',
    bio: '',
    jobTitle: ''
  };
};

/**
 * Save resume data
 * @param {Object} resumeData - Resume data
 */
export const saveResumeData = (resumeData) => {
  return saveData(STORAGE_KEYS.RESUMES, resumeData);
};

/**
 * Get resume data
 * @returns {Object} - Resume data
 */
export const getResumeData = () => {
  return getData(STORAGE_KEYS.RESUMES) || null;
};

/**
 * Save app settings and sync with backend if possible
 * @param {Object} settings - App settings
 * @returns {Promise<boolean>} - Whether settings were saved successfully
 */
export const saveSettings = async (settings) => {
  // First save to localStorage
  const localSaveResult = saveData(STORAGE_KEYS.SETTINGS, settings);
  
  // Then try to sync with backend
  try {
    await fetch('/api/users/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    return true;
  } catch (error) {
    console.warn('Failed to sync settings with backend, using localStorage only:', error);
    return localSaveResult;
  }
};

/**
 * Get app settings, prioritizing backend if available
 * @returns {Object} - App settings
 */
export const getSettings = () => {
  // Get from localStorage first as a fallback
  const localSettings = getData(STORAGE_KEYS.SETTINGS);
  
  // Default settings if nothing is found
  const defaultSettings = {
    provider: 'openrouter',
    model: 'openrouter/quasar-alpha',
    apiKeys: {
      openai: '',
      gemini: '',
      openrouter: '',
      anthropic: '',
      mistral: ''
    }
  };
  
  return localSettings || defaultSettings;
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 */
export const savePreferences = (preferences) => {
  return saveData(STORAGE_KEYS.PREFERENCES, preferences);
};

/**
 * Get user preferences
 * @returns {Object} - User preferences
 */
export const getPreferences = () => {
  return getData(STORAGE_KEYS.PREFERENCES) || {
    jobTypes: [],
    locations: [],
    skills: [],
    experience: ''
  };
};

/**
 * Save saved jobs
 * @param {Array} jobs - Saved jobs
 */
export const saveJobs = (jobs) => {
  return saveData(STORAGE_KEYS.JOBS, jobs);
};

/**
 * Get saved jobs
 * @returns {Array} - Saved jobs
 */
export const getSavedJobs = () => {
  return getData(STORAGE_KEYS.JOBS) || [];
};

/**
 * Initialize all data from localStorage
 * This ensures data is loaded when the application starts
 */
export const initializeAllData = () => {
  // Load all data types
  getUserProfile();
  getResumeData();
  getSettings();
  getPreferences();
  getSavedJobs();

  // Add event listener to save data before window unload
  window.addEventListener('beforeunload', () => {
    // Save all data to localStorage
    saveAllData();
  });

  return {
    profile: getUserProfile(),
    resume: getResumeData(),
    settings: getSettings(),
    preferences: getPreferences(),
    jobs: getSavedJobs()
  };
};

/**
 * Save all data to localStorage at once
 * This is useful for ensuring all data is saved before the application closes
 */
export const saveAllData = (data = null) => {
  const dataToSave = data || {
    profile: getUserProfile(),
    resume: getResumeData(),
    settings: getSettings(),
    preferences: getPreferences(),
    jobs: getSavedJobs()
  };

  // Force save to localStorage
  try {
    // Only save data that exists
    if (dataToSave.profile) localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(dataToSave.profile));
    if (dataToSave.resume) localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(dataToSave.resume));
    if (dataToSave.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(dataToSave.settings));
    if (dataToSave.preferences) localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(dataToSave.preferences));
    if (dataToSave.jobs) localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(dataToSave.jobs));
    return true;
  } catch (error) {
    console.error('Error saving all data:', error);
    return false;
  }
};

// Export storage keys for direct access if needed
export { STORAGE_KEYS };
