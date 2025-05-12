/**
 * AI Service for frontend AI functionality
 * Handles communication with the backend AI endpoints
 */

import { apiRequest } from '../api';
import { getSettings } from './storage-service';

/**
 * Check if AI functionality is available (API key is set)
 * @returns {boolean} - Whether AI functionality is available
 */
export const isAIAvailable = () => {
  const settings = getSettings();
  
  // Check if we have an OpenRouter API key
  return settings && 
         settings.apiKeys && 
         typeof settings.apiKeys.openrouter === 'string' && 
         settings.apiKeys.openrouter.trim().length > 0;
};

/**
 * Get the current AI provider and model from settings
 * @returns {Object} - Provider and model information
 */
export const getAIConfig = () => {
  const settings = getSettings();
  return {
    provider: settings?.provider || 'openrouter',
    model: settings?.model || 'openrouter/quasar-alpha'
  };
};

/**
 * Create a chat completion with the AI
 * @param {Array} messages - Array of messages in the conversation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - AI response
 */
export const createChatCompletion = async (messages, options = {}) => {
  if (!isAIAvailable()) {
    throw new Error('AI functionality is not available. Please set your API key in the settings.');
  }

  const { model, temperature, maxTokens, stream } = options;
  const config = getAIConfig();

  try {
    const endpoint = stream ? '/api/ai/chat/stream' : '/api/ai/chat';
    
    const response = await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: model || config.model,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 1000,
        stream: !!stream
      }),
    });

    return response;
  } catch (error) {
    console.error('Error creating chat completion:', error);
    throw error;
  }
};

/**
 * Get available AI models from the backend
 * @returns {Promise<Array>} - Array of available models
 */
export const getAvailableModels = async () => {
  if (!isAIAvailable()) {
    throw new Error('AI functionality is not available. Please set your API key in the settings.');
  }

  try {
    const models = await apiRequest('/api/ai/models');
    return models;
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
};

/**
 * Parse a resume using AI
 * @param {string} resumeText - Resume text to parse
 * @returns {Promise<Object>} - Parsed resume data
 */
export const parseResumeWithAI = async (resumeText) => {
  if (!isAIAvailable()) {
    throw new Error('AI functionality is not available. Please set your API key in the settings.');
  }

  if (!resumeText) {
    throw new Error('Resume text is required');
  }

  try {
    const response = await apiRequest('/api/ai/parse-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeText }),
    });

    return response;
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw error;
  }
};

/**
 * Sync AI settings with the backend
 * @param {Object} settings - AI settings to sync
 * @returns {Promise<Object>} - Updated settings
 */
export const syncAISettings = async (settings) => {
  try {
    const response = await apiRequest('/api/users/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    return response;
  } catch (error) {
    console.error('Error syncing AI settings with backend:', error);
    throw error;
  }
};

export default {
  isAIAvailable,
  getAIConfig,
  createChatCompletion,
  getAvailableModels,
  parseResumeWithAI,
  syncAISettings
};