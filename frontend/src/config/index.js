// Frontend configuration
// Automatically detects and applies Replit-specific settings when needed

import replitConfig from './replit.js';

// Default configuration for local development
const defaultConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  enableAIParsing: import.meta.env.VITE_ENABLE_AI_PARSING === 'true',
  showRawAIOutput: import.meta.env.VITE_SHOW_RAW_AI_OUTPUT === 'true',
  isReplit: false,
};

// Detect if we're running on Replit
const isReplit = window.location.hostname.includes('.repl.co');

// Export the appropriate configuration
const config = isReplit ? replitConfig : defaultConfig;

console.log('App running with config:', config);

export default config;
