const AIProviderInterface = require('./aiProvider.interface.js');

/**
 * OpenRouter AI Provider using Vercel AI SDK
 */
class OpenRouterProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    // TODO: Initialize Vercel AI SDK client with apiKey
  }

  async createChatCompletion(options) {
    // TODO: Implement OpenRouter chat completion via Vercel AI SDK
    throw new Error('OpenRouter createChatCompletion not implemented.');
  }

  async parseResume(resumeText) {
    // TODO: Implement resume parsing logic using OpenRouter
    throw new Error('OpenRouter parseResume not implemented.');
  }
}

module.exports = OpenRouterProvider;