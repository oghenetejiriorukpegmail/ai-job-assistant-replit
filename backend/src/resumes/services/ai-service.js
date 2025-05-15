// backend/src/resumes/services/ai-service.js

const axios = require('axios');
const axiosRetry = require('axios-retry');

// Configure axios-retry
axiosRetry(axios, {
  retries: 3, // Number of retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response && error.response.status >= 500);
  }
});

// Default timeout for AI API requests (15 seconds)
const DEFAULT_TIMEOUT = 15000;

/**
 * Parse resume text using OpenAI
 * @param {string} text - Resume text content
 * @param {string} apiKey - OpenAI API key
 * @param {string} model - OpenAI model to use
 * @returns {Promise<Object>} - Structured resume data
 */
async function parseWithOpenAI(text, apiKey = null, model = 'gpt-3.5-turbo') {
  if (!text) {
    throw new Error('Resume text is required for AI parsing');
  }

  const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is required. Please provide an API key in your settings.');
  }

  // Create a controller for request cancellation (timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured information from the resume text.
            Return a JSON object with the following structure:
            {
              "skills": ["skill1", "skill2", ...],
              "experience": [
                {
                  "title": "Job Title",
                  "company": "Company Name",
                  "duration": "Start Date - End Date",
                  "description": "Job description"
                },
                ...
              ],
              "education": [
                {
                  "degree": "Degree Name",
                  "institution": "Institution Name",
                  "year": "Graduation Year"
                },
                ...
              ]
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        signal: controller.signal,
        timeout: DEFAULT_TIMEOUT
      }
    );

    // Clear the timeout since the request completed successfully
    clearTimeout(timeoutId);

    // Validate response structure
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', response.data);
      throw new Error('Received invalid response from OpenAI');
    }

    const aiResponse = response.data.choices[0].message.content;
    
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                        aiResponse.match(/```\n([\s\S]*?)\n```/) ||
                        [null, aiResponse];
      
      const parsedData = JSON.parse(jsonMatch[1]);
      
      // Validate the parsed data structure
      return validateAIResponse(parsedData);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI response. The AI returned an invalid JSON format.');
    }
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('OpenAI request timed out. Please try again later.');
    }
    
    if (error.response) {
      // Handle specific HTTP error codes
      switch (error.response.status) {
        case 401:
          throw new Error('Authentication failed with OpenAI. Please check your API key in Settings.');
        case 429:
          throw new Error('OpenAI rate limit exceeded. Please try again later or upgrade your API plan.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('OpenAI service is currently unavailable. Please try again later.');
        default:
          console.error('OpenAI API error:', error.response.data);
          throw new Error(`OpenAI API error: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    }
    
    // Handle network errors
    if (error.request) {
      throw new Error('Network error when connecting to OpenAI. Please check your internet connection.');
    }
    
    // Handle other errors
    throw new Error(`Failed to process with OpenAI: ${error.message}`);
  }
}

/**
 * Parse resume text using Google's Gemini API
 * @param {string} text - Resume text content
 * @param {string} apiKey - Google API key
 * @param {string} model - Gemini model to use
 * @returns {Promise<Object>} - Structured resume data
 */
async function parseWithGemini(text, apiKey = null, model = 'gemini-pro') {
  if (!text) {
    throw new Error('Resume text is required for AI parsing');
  }

  const googleApiKey = apiKey || process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new Error('Google API key is required. Please provide an API key in your settings.');
  }

  // Handle model name conversion for Google models
  if (model.startsWith('google/')) {
    model = model.replace('google/', '');
  }

  // Ensure model has the correct format
  if (!model.includes('-')) {
    model = 'gemini-pro'; // Default to gemini-pro if model format is incorrect
  }

  // Create a controller for request cancellation (timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Parse the following resume and extract structured information.
                Return a JSON object with the following structure:
                {
                  "skills": ["skill1", "skill2", ...],
                  "experience": [
                    {
                      "title": "Job Title",
                      "company": "Company Name",
                      "duration": "Start Date - End Date",
                      "description": "Job description"
                    },
                    ...
                  ],
                  "education": [
                    {
                      "degree": "Degree Name",
                      "institution": "Institution Name",
                      "year": "Graduation Year"
                    },
                    ...
                  ]
                }

                Resume text:
                ${text}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        timeout: DEFAULT_TIMEOUT
      }
    );

    // Clear the timeout since the request completed successfully
    clearTimeout(timeoutId);

    // Validate response structure
    if (!response.data || !response.data.candidates || !response.data.candidates[0] ||
        !response.data.candidates[0].content || !response.data.candidates[0].content.parts) {
      console.error('Invalid Gemini response structure:', response.data);
      throw new Error('Received invalid response from Google Gemini');
    }

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                      aiResponse.match(/```\n([\s\S]*?)\n```/) ||
                      [null, aiResponse];

    try {
      const parsedData = JSON.parse(jsonMatch[1]);
      
      // Validate the parsed data structure
      return validateAIResponse(parsedData);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI response. The AI returned an invalid JSON format.');
    }
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error('Google Gemini request timed out. Please try again later.');
    }
    
    if (error.response) {
      // Handle specific HTTP error codes
      if (error.response.status === 400 && error.response.data?.error?.message?.includes('API key')) {
        throw new Error('Authentication failed with Google Gemini. Please check your API key in Settings.');
      } else if (error.response.status === 429) {
        throw new Error('Google Gemini rate limit exceeded. Please try again later or upgrade your API plan.');
      } else if (error.response.status >= 500) {
        throw new Error('Google Gemini service is currently unavailable. Please try again later.');
      } else {
        console.error('Gemini API error:', error.response.data);
        throw new Error(`Google Gemini API error: ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    }
    
    // Handle network errors
    if (error.request) {
      throw new Error('Network error when connecting to Google Gemini. Please check your internet connection.');
    }
    
    // Handle other errors
    throw new Error(`Failed to process with Google Gemini: ${error.message}`);
  }
}

/**
 * Parse resume text using OpenRouter API
 * @param {string} text - Resume text content
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - OpenRouter model to use
 * @returns {Promise<Object>} - Structured resume data
 */
async function parseWithOpenRouter(text, apiKey = null, model = 'openrouter/quasar-alpha') {
  if (!text) {
    throw new Error('Resume text is required for AI parsing');
  }

  const openrouterApiKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    throw new Error('OpenRouter API key is required. Please provide an API key in your settings.');
  }

  // Create a controller for request cancellation (timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured information from the resume text.
            Return a JSON object with the following structure:
            {
              "skills": ["skill1", "skill2", ...],
              "experience": [
                {
                  "title": "Job Title",
                  "company": "Company Name",
                  "duration": "Start Date - End Date",
                  "description": "Job description"
                },
                ...
              ],
              "education": [
                {
                  "degree": "Degree Name",
                  "institution": "Institution Name",
                  "year": "Graduation Year"
                },
                ...
              ]
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://jobapplication.com',
          'X-Title': 'Job Application Portal'
        },
        signal: controller.signal,
        timeout: DEFAULT_TIMEOUT
      }
    );

    // Clear the timeout since the request completed successfully
    clearTimeout(timeoutId);

    // Validate response structure
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Invalid OpenRouter response structure:', response.data);
      throw new Error('Received invalid response from OpenRouter');
    }

    const aiResponse = response.data.choices[0].message.content;
    
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                        aiResponse.match(/```\n([\s\S]*?)\n```/) ||
                        [null, aiResponse];
      
      const parsedData = JSON.parse(jsonMatch[1]);
      
      // Validate the parsed data structure
      return validateAIResponse(parsedData);
    } catch (parseError) {
      console.error('Error parsing OpenRouter response:', parseError, 'Raw response:', aiResponse);
      throw new Error('Failed to parse AI response. The AI returned an invalid JSON format.');
    }
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
          throw new Error('Authentication failed with OpenRouter. Please check your API key in Settings.');
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
    throw new Error(`Failed to process with OpenRouter: ${error.message}`);
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
  parseWithOpenAI,
  parseWithGemini,
  parseWithOpenRouter,
  validateAIResponse
};
