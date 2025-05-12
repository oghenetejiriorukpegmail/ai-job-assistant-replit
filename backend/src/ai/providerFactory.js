const { getApiKey } = require('./apiKeyManager.js');
const OpenRouterProvider = require('./providers/openrouter.provider.js');
const OpenAIProvider = require('./providers/openai.provider.js');
const AnthropicProvider = require('./providers/anthropic.provider.js');
const GeminiProvider = require('./providers/gemini.provider.js');
const MistralProvider = require('./providers/mistral.provider.js');

/**
 * Provider Factory
 * @param {Object} userSettings - User preferences and API keys
 * @returns {AIProviderInterface} - An instance of the selected provider
 */
function getProvider(userSettings = {}) {
  const providerName = (userSettings.preferredProvider || '').toLowerCase();
  console.log(`[ProviderFactory] Requested provider: ${providerName}`);

  if (!providerName) {
    console.log('[ProviderFactory] No AI provider specified in user settings.');
    throw new Error('No AI provider specified in user settings.');
  }

  const apiKey = getApiKey(providerName, userSettings);
  console.log(`[ProviderFactory] API key for ${providerName}: ${apiKey.slice(0, 4)}***`);

  switch (providerName) {
    case 'openrouter':
      console.log('[ProviderFactory] Instantiating OpenRouterProvider');
      return new OpenRouterProvider(apiKey);
    case 'openai':
      console.log('[ProviderFactory] Instantiating OpenAIProvider');
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      console.log('[ProviderFactory] Instantiating AnthropicProvider');
      return new AnthropicProvider(apiKey);
    case 'gemini':
      console.log('[ProviderFactory] Instantiating GeminiProvider');
      return new GeminiProvider(apiKey);
    case 'mistral':
      console.log('[ProviderFactory] Instantiating MistralProvider');
      return new MistralProvider(apiKey);
    default:
      console.log(`[ProviderFactory] Unsupported AI provider: ${providerName}`);
      throw new Error(`Unsupported AI provider: ${providerName}`);
  }
}

module.exports = { getProvider };