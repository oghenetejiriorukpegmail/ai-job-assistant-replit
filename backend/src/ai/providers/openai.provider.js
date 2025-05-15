const AIProviderInterface = require('./aiProvider.interface.js');

/**
 * OpenAI Provider
 */
class OpenAIProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    // TODO: Initialize OpenAI SDK client with apiKey
  }

  async createChatCompletion(options) {
    // TODO: Implement OpenAI chat completion
    throw new Error('OpenAI createChatCompletion not implemented.');
  }

  async parseResume(resumeText) {
    // TODO: Implement resume parsing logic using OpenAI
    throw new Error('OpenAI parseResume not implemented.');
  }
}

module.exports = OpenAIProvider;