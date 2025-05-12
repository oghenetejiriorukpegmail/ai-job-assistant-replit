/**
 * AI routes for OpenRouter integration
 */

const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route POST /api/ai/chat
 * @desc Create a chat completion
 * @access Private
 */
router.post('/chat', authMiddleware, aiController.createChatCompletion);

/**
 * @route POST /api/ai/chat/stream
 * @desc Create a streaming chat completion
 * @access Private
 */
router.post('/chat/stream', authMiddleware, aiController.createStreamingChatCompletion);

/**
 * @route GET /api/ai/models
 * @desc Get available AI models
 * @access Private
 */
router.get('/models', authMiddleware, aiController.getAvailableModels);

/**
 * @route POST /api/ai/resume-parse
 * @desc Parse a resume using AI
 * @access Private
 */
router.post('/resume-parse', authMiddleware, aiController.parseResume);

module.exports = router;
