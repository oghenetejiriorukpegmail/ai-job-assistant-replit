/**
 * AI Provider Interface
 * All providers must implement these async methods.
 */
class AIProviderInterface {
  /**
   * Create a chat completion response.
   * @param {Object} options - The options for chat completion.
   * @returns {Promise<Object>} - The response from the AI provider.
   */
  async createChatCompletion(options) {
    throw new Error('Method not implemented.');
  }

  /**
   * Parse a resume.
   * @param {string} resumeText - The resume text to parse.
   * @returns {Promise<Object>} - The parsed resume data.
   */
  async parseResume(resumeText) {
    throw new Error('Method not implemented.');
  }
}

module.exports = AIProviderInterface;