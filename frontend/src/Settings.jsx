// frontend/src/Settings.jsx

/**
 * Settings page component.
 * Placeholder for user settings.
 *
 * Author: Roo
 * Date: 2025-04-07
 */


import React, { useState, useEffect } from 'react';
import { apiRequest } from './api';
import { useTheme } from './context/ThemeContext';
import { saveSettings as saveSettingsToStorage, getSettings } from './services/storage-service';
import { syncAISettings } from './services/ai-service';

function Settings() {
  // Get theme context
  const { theme, toggleTheme } = useTheme();

  // AI parsing is always enabled by default
  const [provider, setProvider] = useState('openrouter');
  const [model, setModel] = useState('openrouter/quasar-alpha');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Set AI parsing to always be enabled
    localStorage.setItem('enableAIParsing', 'true');

    // Try to load settings from storage service first (which already has localStorage fallback)
    const savedSettings = getSettings();
    
    // Update state with saved values
    if (savedSettings.provider) setProvider(savedSettings.provider);
    if (savedSettings.model) setModel(savedSettings.model);
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        // Fetch settings from backend
        const data = await apiRequest('/api/users/settings');
        
        // Update state with backend values
        if (typeof data.provider === 'string') setProvider(data.provider);
        if (typeof data.model === 'string') setModel(data.model);
        // Also update localStorage with these values for consistency
        const settings = {
          provider: data.provider || provider,
          model: data.model || model
          // apiKeys removed
        };
        saveSettingsToStorage(settings);
      } catch (error) {
        console.error('Failed to fetch settings from backend, using localStorage values:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get available models based on selected provider
  const getModelsForProvider = (providerName) => {
    switch(providerName) {
      case 'openai':
        return [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ];
      case 'google':
        return [
          { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro (Latest)' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ];
      case 'gemini-2.0-flash':
      case 'gemini-2.5-pro':
        return [
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' }
        ];
      case 'openrouter':
        return [
          // Existing models
          { id: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini 2.5 Pro (Free)' },
          { id: 'openrouter/quasar-alpha', name: 'Quasar Alpha (Experimental)' },
          { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
          { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
          { id: 'mistralai/mixtral-8x7b', name: 'Mixtral 8x7B' },
          { id: 'meta-llama/llama-3-70b', name: 'Llama 3 70B' },
          // Additional free/low-cost models (check OpenRouter docs for current free status)
          { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)' },
          { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B Beta (Free)' },
          { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free', name: 'Nous Hermes 2 Mixtral 8x7B DPO (Free)' },
          { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Instruct (Free)' },
          { id: 'google/gemma-7b-it:free', name: 'Google Gemma 7B (Free)' },
          { id: 'microsoft/phi-2:free', name: 'Microsoft Phi-2 (Free)' },
          { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B (Free)' },
          // User requested models
          { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen Qwen3-235B (Free)' },
          { id: 'meta-llama/llama-4-maverick:free', name: 'Meta Llama-4 Maverick (Free)' },
          { id: 'thudm/glm-4-32b:free', name: 'THUDM GLM-4-32B (Free)' }
        ];
      case 'anthropic':
        return [
          { id: 'claude-3-opus', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
          { id: 'claude-2.1', name: 'Claude 2.1' }
        ];
      case 'mistral':
        return [
          { id: 'mistral-large', name: 'Mistral Large' },
          { id: 'mistral-medium', name: 'Mistral Medium' },
          { id: 'mistral-small', name: 'Mistral Small' },
          { id: 'mixtral-8x7b', name: 'Mixtral 8x7B' }
        ];
      default:
        return [{ id: 'default', name: 'Default Model' }];
    }
  };

  // Handle provider change
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    // Set a default model for the new provider
    const models = getModelsForProvider(newProvider);
    if (models.length > 0) {
      setModel(models[0].id);
    }
  };

  const saveSettings = async () => {
    const settings = {
      enableAIParsing: true, // Always enabled
      provider,
      model
      // apiKeys removed
    };
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      // Save to storage service (which handles both localStorage and backend sync)
      await saveSettingsToStorage(settings);
      
      // Also sync with backend using the AI service
      await syncAISettings(settings);

      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get current models based on selected provider
  const availableModels = getModelsForProvider(provider);

  return (
    <div>
      <div className="card settings-card">
        <h2>Theme Settings</h2>
        <div className="theme-settings">
          <div className="form-group">
            <label>Current Theme: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}</label>
            <div className="theme-toggle-container">
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => theme === 'dark' && toggleTheme()}
              >
                <i className="fas fa-sun"></i> Light
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => theme === 'light' && toggleTheme()}
              >
                <i className="fas fa-moon"></i> Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card settings-card">
        <h2>AI Settings</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {isLoading ? (
          <div className="loading-spinner">Loading settings...</div>
        ) : (
          <>
            <div className="settings-section">
              <h3>AI Provider Settings</h3>

              <div className="form-group">
                <label htmlFor="provider-select">Select AI Provider:</label>
                <select
                  id="provider-select"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  disabled={isSaving}
                  className="provider-select"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="google">Google AI (Gemini)</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini-2.0-flash">Google Gemini Legacy</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="mistral">Mistral AI</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="model-select">Select Model:</label>
                <select
                  id="model-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isSaving}
                  className="model-select"
                >
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <button
              onClick={saveSettings}
              className={`btn-primary ${isSaving ? 'loading' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Settings;