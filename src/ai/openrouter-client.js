/**
 * OpenRouter client for AI interactions
 * Implements the Vercel AI SDK for OpenRouter
 */

const axios = require('axios');
const { OpenAIStream, StreamingTextResponse } = require('ai');
require('dotenv').config();

// Get API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Create a chat completion with OpenRouter
 * @param {Object} options - Options for the chat completion
 * @param {Array} options.messages - Array of messages in the conversation
 * @param {string} options.model - Model to use for the completion
 * @param {number} options.temperature - Temperature for the completion
 * @param {number} options.max_tokens - Maximum tokens to generate
 * @param {boolean} options.stream - Whether to stream the response
 * @returns {Promise<Object|StreamingTextResponse>} - Response from OpenRouter
 */
async function createChatCompletion(options) {
  const { 
    messages, 
    model = 'openrouter/quasar-alpha', 
    temperature = 0.7, 
    max_tokens = 1000, 
    stream = false 
  } = options;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    // Prepare request payload
    const payload = {
      model,
      messages,
      temperature,
      max_tokens,
      stream,
      http_referer: 'https://job-application-saas.com',
      user: 'job-application-saas-user',
    };

    // Make request to OpenRouter
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://job-application-saas.com',
          'X-Title': 'Job Application SaaS',
        },
        responseType: stream ? 'stream' : 'json',
      }
    );

    // Handle streaming response
    if (stream) {
      const openAIStream = OpenAIStream(response.data);
      return new StreamingTextResponse(openAIStream);
    }

    // Return regular response
    return response.data;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get available models from OpenRouter
 * @returns {Promise<Array>} - Array of available models
 */
async function getAvailableModels() {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.get(
      `${OPENROUTER_BASE_URL}/models`,
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://job-application-saas.com',
          'X-Title': 'Job Application SaaS',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  createChatCompletion,
  getAvailableModels,
};
