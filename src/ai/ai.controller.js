/**
 * AI controller for OpenRouter integration
 */

const { createChatCompletion, getAvailableModels } = require('./openrouter-client');
const { Setting } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');

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
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Get user settings for API key and default model
    let userSettings;
    if (isUsingFallback()) {
      const settings = getInMemoryStore().settings;
      userSettings = settings.find(s => s.userId === req.userId.toString());
    } else {
      userSettings = await Setting.findOne({ userId: req.userId });
    }

    // Use model from request, user settings, or default
    const modelToUse = model || (userSettings?.provider === 'openrouter' ? userSettings.model : 'openrouter/quasar-alpha');
    
    // Create chat completion
    const completion = await createChatCompletion({
      messages,
      model: modelToUse,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      stream: false,
    });

    return res.status(200).json(completion);
  } catch (error) {
    console.error('Chat completion error:', error);
    return res.status(500).json({ error: error.message });
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
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Get user settings for API key and default model
    let userSettings;
    if (isUsingFallback()) {
      const settings = getInMemoryStore().settings;
      userSettings = settings.find(s => s.userId === req.userId.toString());
    } else {
      userSettings = await Setting.findOne({ userId: req.userId });
    }

    // Use model from request, user settings, or default
    const modelToUse = model || (userSettings?.provider === 'openrouter' ? userSettings.model : 'openrouter/quasar-alpha');
    
    // Create streaming chat completion
    const streamingResponse = await createChatCompletion({
      messages,
      model: modelToUse,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      stream: true,
    });

    // The StreamingTextResponse is handled by the Vercel AI SDK
    return streamingResponse;
  } catch (error) {
    console.error('Streaming chat completion error:', error);
    return res.status(500).json({ error: error.message });
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
    const models = await getAvailableModels();
    return res.status(200).json(models);
  } catch (error) {
    console.error('Get models error:', error);
    return res.status(500).json({ error: error.message });
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
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Get user settings for API key and default model
    let userSettings;
    if (isUsingFallback()) {
      const settings = getInMemoryStore().settings;
      userSettings = settings.find(s => s.userId === req.userId.toString());
    } else {
      userSettings = await Setting.findOne({ userId: req.userId });
    }

    // Use model from user settings or default
    const modelToUse = (userSettings?.provider === 'openrouter' ? userSettings.model : 'openrouter/quasar-alpha');

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

    // Create chat completion for resume parsing
    const completion = await createChatCompletion({
      messages: [
        systemPrompt,
        { role: 'user', content: resumeText }
      ],
      model: modelToUse,
      temperature: 0.3, // Lower temperature for more deterministic results
      max_tokens: 2000,
      stream: false,
    });

    // Extract the content from the completion
    const content = completion.choices[0].message.content;
    
    // Parse the JSON response
    let parsedResume;
    try {
      parsedResume = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json({
      structured: parsedResume,
      provider: 'openrouter',
      model: modelToUse
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createChatCompletion,
  createStreamingChatCompletion,
  getAvailableModels,
  parseResume,
};
