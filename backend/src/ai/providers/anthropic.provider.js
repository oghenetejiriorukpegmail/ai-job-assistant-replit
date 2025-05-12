const AIProviderInterface = require('./aiProvider.interface.js');

/**
 * Anthropic Provider
 */
class AnthropicProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    // TODO: Initialize Anthropic SDK client with apiKey
  }

  async createChatCompletion(options) {
    // TODO: Implement Anthropic chat completion
    throw new Error('Anthropic createChatCompletion not implemented.');
  }

  async parseResume(resumeText) {
    // TODO: Implement resume parsing logic using Anthropic
    throw new Error('Anthropic parseResume not implemented.');
  }
}

module.exports = AnthropicProvider;