// backend/src/resumes/resume.controller.js

/**
 * Resume upload and parsing controller.
 * Handles secure upload, parsing, and storage of resume data.
 *
 * Security-first approach:
 * - Accepts only PDF/DOCX
 * - Validates file type and size
 * - Parses content securely
 * - Stores parsed structured data linked to user
 */

// Import utilities and services
const axios = require('axios');
const { upload, extractTextFromPDF, extractTextFromDOCX, validateFile } = require('./utils/file-utils');
const { extractStructuredData } = require('./utils/data-extraction');
const { parseWithOpenAI, parseWithGemini, parseWithOpenRouter } = require('./services/ai-service');
const { parsedResumes, storeResumeData, getResumeById, getResumesByUserId } = require('./services/resume-service');

// Import models and database utilities
const { User, Setting } = require('../models');
const { isUsingFallback, getInMemoryStore } = require('../config/database');

// We'll use axios to call our AI module API endpoint
// This avoids circular dependency issues

/**
 * Upload and parse a resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadResume(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from authenticated user
    const userId = req.user.id;

    // Process file upload using multer middleware
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        // Handle specific multer errors with clear messages
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File size exceeds the maximum limit',
            details: `Maximum file size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
          });
        } else if (err.message.includes('Only')) {
          return res.status(400).json({
            error: 'Unsupported file type',
            details: `Supported file types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`
          });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Validate the uploaded file
        const validationResult = validateFile(req.file);
        if (!validationResult.valid) {
          return res.status(400).json({
            error: 'File validation failed',
            details: validationResult.message
          });
        }

        // Extract text based on file type
        let text = '';
        try {
          if (req.file.mimetype === 'application/pdf') {
            text = await extractTextFromPDF(req.file.buffer);
          } else if (req.file.mimetype === 'application/msword') {
            return res.status(400).json({
              error: 'DOC format not supported',
              details: 'Please convert your resume to DOCX or PDF format'
            });
          } else {
            text = await extractTextFromDOCX(req.file.buffer);
          }
        } catch (extractionError) {
          console.error('Text extraction error:', extractionError);
          return res.status(422).json({
            error: 'Failed to extract text from file',
            details: extractionError.message
          });
        }

        // Check if we got any text content
        if (!text || text.trim().length === 0) {
          return res.status(422).json({
            error: 'No text content found in file',
            details: 'The uploaded file appears to be empty or contains no extractable text'
          });
        }

        // Extract structured data using regex
        const structuredData = extractStructuredData(text);

        // Validate structured data
        if (!structuredData.skills.length && !structuredData.experience.length && !structuredData.education.length) {
          return res.status(422).json({
            error: 'Failed to parse resume content',
            details: 'Could not extract any structured data from the resume. Please check the file format and content.'
          });
        }

        // Store the parsed resume with file info
        const fileInfo = {
          filename: req.file.originalname,
          fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx',
          fileSize: req.file.size,
          provider: 'basic-parser',
          filePath: `uploads/resumes/${Date.now()}-${req.file.originalname}`
        };
        
        const resumeId = await storeResumeData(userId, structuredData, fileInfo);

        // Return the structured data
        return res.status(200).json({
          message: 'Resume uploaded and parsed successfully.',
          resumeId,
          provider: 'Basic Parser',
          structured: structuredData
        });
      } catch (error) {
        console.error('Error processing resume:', error);
        return res.status(500).json({
          error: 'Failed to process resume',
          details: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error in uploadResume:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Upload and parse a resume using AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadResumeWithAI(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from authenticated user
    const userId = req.user.id;

    // Get AI provider from query params (default to OpenRouter)
    const provider = req.query.provider || 'openrouter';

    // Get API key and model from headers
    const apiKey = req.headers['x-api-key'];
    const model = req.query.model || null;

    // Process file upload using multer middleware
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        // Handle specific multer errors with clear messages
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File size exceeds the maximum limit',
            details: `Maximum file size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
          });
        } else if (err.message.includes('Only')) {
          return res.status(400).json({
            error: 'Unsupported file type',
            details: `Supported file types: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`
          });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Validate the uploaded file
        const validationResult = validateFile(req.file);
        if (!validationResult.valid) {
          return res.status(400).json({
            error: 'File validation failed',
            details: validationResult.message
          });
        }

        // Extract text based on file type
        let text = '';
        try {
          if (req.file.mimetype === 'application/pdf') {
            text = await extractTextFromPDF(req.file.buffer);
          } else if (req.file.mimetype === 'application/msword') {
            return res.status(400).json({
              error: 'DOC format not supported',
              details: 'Please convert your resume to DOCX or PDF format'
            });
          } else {
            text = await extractTextFromDOCX(req.file.buffer);
          }
        } catch (extractionError) {
          console.error('Text extraction error:', extractionError);
          return res.status(422).json({
            error: 'Failed to extract text from file',
            details: extractionError.message
          });
        }

        // Check if we got any text content
        if (!text || text.trim().length === 0) {
          return res.status(422).json({
            error: 'No text content found in file',
            details: 'The uploaded file appears to be empty or contains no extractable text'
          });
        }

        // Prepare file info for storage
        const fileInfo = {
          filename: req.file.originalname,
          fileType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx',
          fileSize: req.file.size,
          provider: provider,
          filePath: `uploads/resumes/${Date.now()}-${req.file.originalname}`
        };

        // Create a controller for request cancellation (timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          // Try to use our AI module first with retry mechanism
          let retryCount = 0;
          const maxRetries = 2;
          let structuredData;
          let aiError;

          while (retryCount <= maxRetries) {
            try {
              const aiResponse = await axios.post(
                'http://localhost:5000/api/ai/resume-parse',
                { resumeText: text },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
                  },
                  signal: controller.signal,
                  timeout: 30000 // 30 second timeout
                }
              );

              // Clear the timeout since the request completed successfully
              clearTimeout(timeoutId);
              
              structuredData = aiResponse.data.structured;
              break; // Success, exit the retry loop
            } catch (error) {
              aiError = error;
              
              // Don't retry if it's a client error (4xx)
              if (error.response && error.response.status >= 400 && error.response.status < 500) {
                break;
              }
              
              // Don't retry if it's an abort error (timeout)
              if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
                console.log(`AI request timed out on attempt ${retryCount + 1}`);
                break;
              }
              
              // Retry for server errors or network issues
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying AI request, attempt ${retryCount} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              }
            }
          }

          // If we have structured data from the AI, use it
          if (structuredData) {
            // Store the parsed resume
            const resumeId = await storeResumeData(userId, structuredData, fileInfo);

            // Return the structured data
            return res.status(200).json({
              message: 'Resume uploaded and parsed successfully with AI.',
              resumeId,
              provider,
              structured: structuredData
            });
          }

          // If AI module failed, try direct API calls
          console.log('Error using AI module, falling back to direct API calls:', aiError?.message);

          // Fall back to direct API calls with retry mechanism
          retryCount = 0;
          
          while (retryCount <= maxRetries) {
            try {
              switch (provider.toLowerCase()) {
                case 'openai':
                  structuredData = await parseWithOpenAI(text, apiKey, model || 'gpt-3.5-turbo');
                  break;
                case 'gemini':
                case 'google':
                case 'gemini-2.0-flash':
                  structuredData = await parseWithGemini(text, apiKey, model || 'gemini-pro');
                  break;
                case 'openrouter':
                default:
                  structuredData = await parseWithOpenRouter(text, apiKey, model || 'openrouter/quasar-alpha');
                  break;
              }
              
              // If we got here, the API call succeeded
              break;
            } catch (error) {
              aiError = error;
              
              // Don't retry if it's a client error (auth issues, etc.)
              if (error.message.includes('Authentication failed') ||
                  error.message.includes('API key')) {
                break;
              }
              
              // Retry for server errors or network issues
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying direct API call, attempt ${retryCount} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              }
            }
          }

          // If we have structured data from direct API calls, use it
          if (structuredData) {
            // Store the parsed resume
            const resumeId = await storeResumeData(userId, structuredData, fileInfo);

            // Return the structured data
            return res.status(200).json({
              message: 'Resume uploaded and parsed successfully with direct API.',
              resumeId,
              provider,
              structured: structuredData
            });
          }

          // If we got here, both AI module and direct API calls failed
          throw new Error('All AI parsing methods failed');
        } catch (aiError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);
          
          console.error(`Error processing resume with ${provider}:`, aiError);

          // Fallback to basic parser if AI fails
          try {
            console.log('Falling back to basic parser due to AI failures');
            const structuredData = extractStructuredData(text);
            
            // Update file info for fallback
            fileInfo.provider = 'basic-parser';
            
            const resumeId = await storeResumeData(userId, structuredData, fileInfo);

            return res.status(200).json({
              message: 'Resume uploaded and parsed with fallback parser.',
              resumeId,
              provider: 'Basic Parser (Fallback)',
              fallbackReason: aiError.message,
              structured: structuredData
            });
          } catch (fallbackError) {
            console.error('Fallback parser also failed:', fallbackError);
            return res.status(500).json({
              error: 'Failed to process resume',
              details: 'Both AI and fallback parsers failed to process the resume',
              aiError: aiError.message,
              fallbackError: fallbackError.message
            });
          }
        }
      } catch (error) {
        console.error(`Error processing resume:`, error);
        return res.status(500).json({
          error: 'Failed to process resume',
          details: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error in uploadResumeWithAI:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Get a resume by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getResume(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resumeId = req.params.id;
    if (!resumeId) {
      return res.status(400).json({
        error: 'Invalid resume ID',
        details: 'A valid resume ID is required'
      });
    }

    try {
      const resume = await getResumeById(resumeId);
      if (!resume) {
        return res.status(404).json({
          error: 'Resume not found',
          details: 'The requested resume does not exist or has been deleted'
        });
      }

      // Check if the resume belongs to the authenticated user
      if (resume.userId && resume.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          error: 'Forbidden',
          details: 'You do not have permission to access this resume'
        });
      }

      return res.status(200).json(resume);
    } catch (dbError) {
      console.error('Database error in getResume:', dbError);
      return res.status(500).json({
        error: 'Database error',
        details: 'Failed to retrieve resume data from the database'
      });
    }
  } catch (error) {
    console.error('Error in getResume:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Get all resumes for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserResumes(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const resumes = await getResumesByUserId(req.user.id);
      
      // Add metadata about the number of resumes
      return res.status(200).json({
        count: resumes.length,
        resumes: resumes
      });
    } catch (dbError) {
      console.error('Database error in getUserResumes:', dbError);
      return res.status(500).json({
        error: 'Database error',
        details: 'Failed to retrieve resume data from the database'
      });
    }
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

module.exports = {
  uploadResume,
  uploadResumeWithAI,
  getResume,
  getUserResumes,
  parsedResumes
};
