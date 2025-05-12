const AIProviderInterface = require('./aiProvider.interface.js');

/**
 * Mistral Provider
 */
class MistralProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    // TODO: Initialize Mistral SDK client with apiKey
  }

  async createChatCompletion(options) {
    // TODO: Implement Mistral chat completion
    throw new Error('Mistral createChatCompletion not implemented.');
  }

  async parseResume(resumeText) {
    // TODO: Implement resume parsing logic using Mistral
    throw new Error('Mistral parseResume not implemented.');
  }
}

module.exports = MistralProvider;