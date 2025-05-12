/**
 * AI client module for OpenRouter integration using Vercel AI SDK
 * This module is separate from the controller to avoid circular dependencies
 */

const { OpenAI } = require('openai');
const { OpenAIStream, StreamingTextResponse } = require('ai');
const axios = require('axios');
const axiosRetry = require('axios-retry');
require('dotenv').config();

// Configure axios-retry for non-streaming requests
axiosRetry(axios, {
  retries: 3, // Number of retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response && error.response.status >= 500);
  }
});

// Default timeout for AI API requests (20 seconds)
const DEFAULT_TIMEOUT = 20000;

// Default base URL for OpenRouter
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
/**
 * Create an OpenAI compatible client for OpenRouter
 * @param {string} apiKey - API key to use
 * @returns {OpenAI} - OpenAI compatible client
 */
function createOpenRouterClient(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required for OpenRouter');
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://job-application-saas.com',
      'X-Title': 'Job Application SaaS',
    },
    defaultQuery: {
      user: 'job-application-saas-user',
    },
    timeout: DEFAULT_TIMEOUT,
  });
}

/**
 * Create a chat completion with OpenRouter
 * @param {Object} options - Options for the chat completion
 * @param {Array} options.messages - Array of messages in the conversation
 * @param {string} options.model - Model to use for the completion
 * @param {number} options.temperature - Temperature for the completion
 * @param {number} options.max_tokens - Maximum tokens to generate
 * @param {boolean} options.stream - Whether to stream the response
 * @param {string} options.apiKey - API key to use
 * @returns {Promise<Object|StreamingTextResponse>} - Response from OpenRouter
 */
async function createChatCompletion(options) {
  const {
    messages,
    model = 'openrouter/quasar-alpha',
    temperature = 0.7,
    max_tokens = 1000,
    stream = false,
    apiKey
  } = options;

  if (!apiKey) {
    throw new Error('API key is required for OpenRouter');
  }

  // Validate messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages are required and must be a non-empty array');
  }

  try {
    // Create OpenRouter client using Vercel AI SDK's OpenAI compatibility
    const openRouter = createOpenRouterClient(apiKey);
    
    // Make request to OpenRouter
    const response = await openRouter.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream
    });

    // Handle streaming response
    if (stream) {
      const stream = OpenAIStream(response);
      return new StreamingTextResponse(stream);
    }

    // Return regular response
    return response;
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('OpenRouter request timed out. Please try again later.');
    }
    
    if (error.response) {
      // Handle specific HTTP error codes
      switch (error.response.status) {
        case 401:
          throw new Error('Authentication failed with OpenRouter. Please check your API key.');
        case 402:
          throw new Error('OpenRouter credits depleted. Please add more credits to your account.');
        case 429:
          throw new Error('OpenRouter rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('OpenRouter service is currently unavailable. Please try again later.');
        default:
          console.error('OpenRouter API error:', error.response.data);
          throw new Error(`OpenRouter API error: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    }
    
    // Handle network errors
    if (error.request) {
      throw new Error('Network error when connecting to OpenRouter. Please check your internet connection.');
    }
    
    // Handle other errors
    throw new Error(`OpenRouter API error: ${error.message}`);
  }
}

/**
 * Get available models from OpenRouter
 * @returns {Promise<Array>} - Array of available models
 */
/**
 * Get available models from OpenRouter
 * @param {string} apiKey - API key to use
 * @returns {Promise<Array>} - Array of available models
 */
async function getAvailableModels(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required for OpenRouter');
  }

  // Create a controller for request cancellation (timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    // Use axios for this request as the OpenAI SDK doesn't have a direct models endpoint
    const response = await axios.get(
      `${OPENROUTER_BASE_URL}/models`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://job-application-saas.com',
          'X-Title': 'Job Application SaaS',
        },
        signal: controller.signal,
        timeout: DEFAULT_TIMEOUT
      }
    );

    // Clear the timeout since the request completed successfully
    clearTimeout(timeoutId);

    // Validate response structure
    if (!response.data || !response.data.data) {
      console.error('Invalid OpenRouter models response structure:', response.data);
      throw new Error('Received invalid response from OpenRouter');
    }

    return response.data.data;
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    handleOpenRouterError(error);
  }
}

/**
 * Handle OpenRouter errors in a consistent way
 * @param {Error} error - The error to handle
 * @throws {Error} - A more specific error
 */
function handleOpenRouterError(error) {
  if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    throw new Error('OpenRouter request timed out. Please try again later.');
  }
  
  if (error.response) {
    // Handle specific HTTP error codes
    switch (error.response.status) {
      case 401:
        throw new Error('Authentication failed with OpenRouter. Please check your API key.');
      case 402:
        throw new Error('OpenRouter credits depleted. Please add more credits to your account.');
      case 429:
        throw new Error('OpenRouter rate limit exceeded. Please try again later.');
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error('OpenRouter service is currently unavailable. Please try again later.');
      default:
        console.error('OpenRouter API error:', error.response.data);
        throw new Error(`OpenRouter API error: ${error.response.data?.error?.message || 'Unknown error'}`);
    }
  }
  
  // Handle network errors
  if (error.request) {
    throw new Error('Network error when connecting to OpenRouter. Please check your internet connection.');
  }
  
  // Handle other errors
  throw new Error(`OpenRouter API error: ${error.message}`);
}

/**
 * Parse a resume using AI
 * @param {string} resumeText - Resume text to parse
 * @param {string} model - Model to use for parsing
 * @returns {Promise<Object>} - Parsed resume data
 */
/**
 * Parse a resume using AI
 * @param {string} resumeText - Resume text to parse
 * @param {string} model - Model to use for parsing
 * @param {string} apiKey - API key to use
 * @returns {Promise<Object>} - Parsed resume data
 */
async function parseResumeWithAI(resumeText, model = 'openrouter/quasar-alpha', apiKey) {
  if (!resumeText) {
    throw new Error('Resume text is required');
  }

  if (!apiKey) {
    throw new Error('API key is required for OpenRouter');
  }

  // Create system prompt for resume parsing
  const systemPrompt = {
    role: 'system',
    content: `You are a resume parsing assistant. Extract structured information from the resume text provided.
    Return a JSON object with the following structure:
    {
      "contact": {
        "name": "",
        "email": "",
        "phone": "",
        "location": ""
      },
      "skills": ["skill1", "skill2", ...],
      "experience": [
        {
          "title": "",
          "company": "",
          "duration": "",
          "description": ""
        },
        ...
      ],
      "education": [
        {
          "degree": "",
          "institution": "",
          "year": ""
        },
        ...
      ]
    }
    Only include the JSON object in your response, nothing else.`
  };

  try {
    // Create chat completion for resume parsing
    const completion = await createChatCompletion({
      messages: [
        systemPrompt,
        { role: 'user', content: resumeText }
      ],
      model: model,
      temperature: 0.3, // Lower temperature for more deterministic results
      max_tokens: 2000,
      stream: false,
      apiKey: apiKey
    });

    // Extract the content from the completion
    const content = completion.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                        content.match(/```\n([\s\S]*?)\n```/) ||
                        [null, content];
      
      const parsedData = JSON.parse(jsonMatch[1]);
      
      // Validate the parsed data structure
      return validateAIResponse(parsedData);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError, 'Raw response:', content);
      throw new Error('Failed to parse AI response. The AI returned an invalid JSON format.');
    }
  } catch (error) {
    // If the AI service fails, throw a more specific error
    if (error.message.includes('timed out')) {
      throw new Error('Resume parsing timed out. Please try again later.');
    } else if (error.message.includes('rate limit')) {
      throw new Error('AI service rate limit exceeded. Please try again later.');
    } else if (error.message.includes('unavailable')) {
      throw new Error('AI service is currently unavailable. Please try again later.');
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Validate AI response structure and ensure it has the required fields
 * @param {Object} data - Parsed AI response
 * @returns {Object} - Validated and sanitized response
 */
function validateAIResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI response is not a valid object');
  }
  
  // Create a sanitized response with default empty arrays for missing fields
  const sanitized = {
    skills: Array.isArray(data.skills) ? data.skills.filter(s => typeof s === 'string') : [],
    experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
      title: typeof exp.title === 'string' ? exp.title : '',
      company: typeof exp.company === 'string' ? exp.company : '',
      duration: typeof exp.duration === 'string' ? exp.duration : '',
      description: typeof exp.description === 'string' ? exp.description : ''
    })) : [],
    education: Array.isArray(data.education) ? data.education.map(edu => ({
      degree: typeof edu.degree === 'string' ? edu.degree : '',
      institution: typeof edu.institution === 'string' ? edu.institution : '',
      year: typeof edu.year === 'string' ? edu.year : ''
    })) : []
  };
  
  // Add contact information if available
  if (data.contact && typeof data.contact === 'object') {
    sanitized.contact = {
      name: typeof data.contact.name === 'string' ? data.contact.name : '',
      email: typeof data.contact.email === 'string' ? data.contact.email : '',
      phone: typeof data.contact.phone === 'string' ? data.contact.phone : '',
      location: typeof data.contact.location === 'string' ? data.contact.location : ''
    };
  }
  
  return sanitized;
}

module.exports = {
  createChatCompletion,
  getAvailableModels,
  parseResumeWithAI,
  validateAIResponse,
  DEFAULT_TIMEOUT,
  createOpenRouterClient,
  handleOpenRouterError
};
