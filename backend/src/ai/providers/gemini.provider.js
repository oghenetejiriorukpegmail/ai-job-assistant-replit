const AIProviderInterface = require('./aiProvider.interface.js');

/**
 * Gemini Provider
 */
class GeminiProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    // TODO: Initialize Gemini SDK client with apiKey
  }

  async createChatCompletion(options) {
    // TODO: Implement Gemini chat completion
    throw new Error('Gemini createChatCompletion not implemented.');
  }

  async parseResume(resumeText) {
    // TODO: Implement resume parsing logic using Gemini
    throw new Error('Gemini parseResume not implemented.');
  }
}

module.exports = GeminiProvider;