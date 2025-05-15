/**
 * API Key Manager
 * Retrieves API keys from user settings or environment variables.
 */

function getApiKey(providerName, userSettings = {}) {
  const envVarMap = {
    openrouter: 'AI_OPENROUTER_API_KEY',
    openai: 'AI_OPENAI_API_KEY',
    anthropic: 'AI_ANTHROPIC_API_KEY',
    gemini: 'AI_GEMINI_API_KEY',
    mistral: 'AI_MISTRAL_API_KEY',
  };

  const envVar = envVarMap[providerName.toLowerCase()];
  console.log(`[APIKeyManager] Provider: ${providerName}, EnvVar: ${envVar}`);
  if (!envVar) {
    console.log(`[APIKeyManager] Unsupported provider: ${providerName}`);
    throw new Error(`Unsupported provider: ${providerName}`);
  }

  // Check user settings first
  const userKey = userSettings[envVar];
  if (userKey) {
    console.log(`[APIKeyManager] Using user-supplied API key for ${providerName}: ${userKey.slice(0, 4)}***`);
    return userKey;
  }

  // Fallback to environment variable
  const envKey = process.env[envVar];
  if (envKey) {
    console.log(`[APIKeyManager] Using environment API key for ${providerName}: ${envKey.slice(0, 4)}***`);
    return envKey;
  }

  console.log(`[APIKeyManager] Missing API key for provider "${providerName}".`);
  throw new Error(`API key for provider "${providerName}" is missing. Please set ${envVar} in environment variables or user settings.`);
}

module.exports = { getApiKey };