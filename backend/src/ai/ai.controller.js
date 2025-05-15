/**
 * AI controller for OpenRouter integration using Vercel AI SDK
 */
const { getProvider } = require('./providerFactory.js');
 

const { createChatCompletion: createChat, getAvailableModels: getModels, parseResumeWithAI, validateAIResponse, DEFAULT_TIMEOUT, handleOpenRouterError } = require('./ai-client');
const { Setting } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');
const { extractStructuredData } = require('../resumes/utils/data-extraction');

/**
 * Create a chat completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response from OpenRouter
 */
async function createChatCompletion(req, res) {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages are required and must be an array',
        details: 'Please provide a valid messages array with at least one message'
      });
    }

    // Get user settings for API key and default model
    let userSettings;
    try {
      if (isUsingFallback()) {
        const settings = getInMemoryStore().settings;
        userSettings = settings.find(s => s.userId === req.user.id.toString());
      } else {
        userSettings = await Setting.findOne({ userId: req.user.id });
      }
    } catch (settingsError) {
      console.error('Error retrieving user settings:', settingsError);
      // Continue with default settings if user settings can't be retrieved
    }

    // Log provider and model used (do not log API keys)
    const providerName = userSettings?.preferredProvider || 'unknown';
    console.log(`[AI DEBUG] Provider: ${providerName}`);
    console.log(`[AI DEBUG] Model: ${model || userSettings?.model || 'default-model'}`);
 
    // Check if we have valid settings
    if (!userSettings) {
      return res.status(400).json({
        error: 'Missing user settings',
        details: 'Please configure your AI provider settings'
      });
    }
 
    // Use model from request, user settings, or default
    const modelToUse = model || (userSettings.model || 'openrouter/quasar-alpha');
    
    try {
      const providerClient = getProvider(userSettings);
      const completion = await providerClient.createChatCompletion({
        messages,
        model: modelToUse,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: false
      });
 
      return res.status(200).json(completion);
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return a more specific error message based on the error type
      if (aiError.message.includes('timed out')) {
        return res.status(504).json({
          error: 'AI service request timed out',
          details: 'The request to the AI service took too long to complete. Please try again later.'
        });
      } else if (aiError.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'AI service rate limit exceeded',
          details: 'The rate limit for the AI service has been exceeded. Please try again later.'
        });
      } else if (aiError.message.includes('Authentication failed')) {
        return res.status(401).json({
          error: 'AI service authentication failed',
          details: 'Please check your API key in the settings.'
        });
      }
      
      // Generic error for other cases
      return res.status(500).json({
        error: 'AI service error',
        details: aiError.message
      });
    }
  } catch (error) {
    console.error('Chat completion error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Create a streaming chat completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {StreamingTextResponse} - Streaming response from OpenRouter
 */
async function createStreamingChatCompletion(req, res) {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Messages are required and must be an array',
        details: 'Please provide a valid messages array with at least one message'
      });
    }

    // Get user settings for API key and default model
    let userSettings;
    try {
      if (isUsingFallback()) {
        const settings = getInMemoryStore().settings;
        userSettings = settings.find(s => s.userId === req.user.id.toString());
      } else {
        userSettings = await Setting.findOne({ userId: req.user.id });
      }
    } catch (settingsError) {
      console.error('Error retrieving user settings:', settingsError);
      // Continue with default settings if user settings can't be retrieved
    }

    // Check if we have valid settings
    if (!userSettings || !userSettings.apiKeys || !userSettings.apiKeys.openrouter) {
      return res.status(400).json({
        error: 'Missing API key',
        details: 'Please set your OpenRouter API key in the settings'
      });
    }

    // Use model from request, user settings, or default
    const modelToUse = model || (userSettings.model || 'openrouter/quasar-alpha');
    
    try {
      // Create streaming chat completion with timeout and user's API key
      const streamingResponse = await createChat({
        messages,
        model: modelToUse,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: true,
        apiKey: userSettings.apiKeys.openrouter
      });

      // The StreamingTextResponse is handled by the Vercel AI SDK
      return streamingResponse;
    } catch (aiError) {
      console.error('AI streaming service error:', aiError);
      
      // Return a more specific error message based on the error type
      if (aiError.message.includes('timed out')) {
        return res.status(504).json({
          error: 'AI service request timed out',
          details: 'The streaming request to the AI service took too long to complete. Please try again later.'
        });
      } else if (aiError.message.includes('rate limit')) {
        return res.status(429).json({
          error: 'AI service rate limit exceeded',
          details: 'The rate limit for the AI service has been exceeded. Please try again later.'
        });
      } else if (aiError.message.includes('Authentication failed')) {
        return res.status(401).json({
          error: 'AI service authentication failed',
          details: 'Please check your API key in the settings.'
        });
      }
      
      // Generic error for other cases
      return res.status(500).json({
        error: 'AI streaming service error',
        details: aiError.message
      });
    }
  } catch (error) {
    console.error('Streaming chat completion error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Get available AI models
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Available models
 */
async function getAvailableModels(req, res) {
  try {
    // Get user settings for API key
    let userSettings;
    try {
      if (isUsingFallback()) {
        const settings = getInMemoryStore().settings;
        userSettings = settings.find(s => s.userId === req.user.id.toString());
      } else {
        userSettings = await Setting.findOne({ userId: req.user.id });
      }
    } catch (settingsError) {
      console.error('Error retrieving user settings:', settingsError);
      // Continue with default settings if user settings can't be retrieved
    }

    // Check if we have valid settings
    if (!userSettings || !userSettings.apiKeys || !userSettings.apiKeys.openrouter) {
      return res.status(400).json({
        error: 'Missing API key',
        details: 'Please set your OpenRouter API key in the settings'
      });
    }

    const models = await getModels(userSettings.apiKeys.openrouter);
    return res.status(200).json(models);
  } catch (error) {
    console.error('Get models error:', error);
    
    // Return a more specific error message based on the error type
    if (error.message.includes('timed out')) {
      return res.status(504).json({
        error: 'AI service request timed out',
        details: 'The request to get available models took too long to complete. Please try again later.'
      });
    } else if (error.message.includes('Authentication failed')) {
      return res.status(401).json({
        error: 'AI service authentication failed',
        details: 'Please check your API key in the settings.'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to retrieve AI models',
      details: error.message
    });
  }
}

/**
 * Parse a resume using AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Parsed resume data
 */
async function parseResume(req, res) {
  try {
    const { resumeText } = req.body;

    // Validate request
    if (!resumeText) {
      return res.status(400).json({
        error: 'Resume text is required',
        details: 'Please provide the resume text to parse'
      });
    }

    // Get user settings for API key and default model
    let userSettings;
    try {
      if (isUsingFallback()) {
        const settings = getInMemoryStore().settings;
        userSettings = settings.find(s => s.userId === req.user.id.toString());
      } else {
        userSettings = await Setting.findOne({ userId: req.user.id });
      }
    } catch (settingsError) {
      console.error('Error retrieving user settings:', settingsError);
      // Continue with default settings if user settings can't be retrieved
    }

    // Check if we have valid settings
    if (!userSettings) {
      return res.status(400).json({
        error: 'Missing user settings',
        details: 'Please configure your AI provider settings'
      });
    }
 
    // Use model from user settings or default
    const modelToUse = userSettings.model || 'openrouter/quasar-alpha';

    try {
      const providerClient = getProvider(userSettings);
      const parsedResume = await providerClient.parseResume(resumeText);

      return res.status(200).json({
        structured: parsedResume,
        provider: 'openrouter',
        model: modelToUse
      });
    } catch (aiError) {
      console.error('AI resume parsing error:', aiError);
      
      // Fall back to basic parser if AI fails
      console.log('Falling back to basic parser due to AI error:', aiError.message);
      
      try {
        // Use the basic parser as a fallback
        const basicParsedResume = extractStructuredData(resumeText);
        
        return res.status(200).json({
          structured: basicParsedResume,
          provider: 'basic-parser-fallback',
          model: 'regex-based-parser',
          fallback: true,
          fallbackReason: aiError.message
        });
      } catch (fallbackError) {
        console.error('Fallback parser also failed:', fallbackError);
        return res.status(500).json({
          error: 'Resume parsing failed',
          details: 'Both AI and fallback parsers failed to process the resume',
          aiError: aiError.message,
          fallbackError: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error('Resume parsing error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

module.exports = {
  createChatCompletion,
  createStreamingChatCompletion,
  getAvailableModels,
  parseResume,
};
