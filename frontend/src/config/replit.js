// Frontend Replit Configuration
// This file is automatically used when running on Replit

const isReplit = typeof process !== 'undefined' && process.env?.REPL_ID !== undefined;
let apiUrl = 'http://localhost:5001'; // Default for local development

// If running on Replit, use the Replit URL
if (isReplit) {
  const replOwner = process.env.REPL_OWNER;
  const replSlug = process.env.REPL_SLUG;
  apiUrl = `https://${replSlug}.${replOwner}.repl.co`;
}

// Check for environment variable as the first priority
if (import.meta.env.VITE_API_URL) {
  apiUrl = import.meta.env.VITE_API_URL;
}

console.log('API URL configured as:', apiUrl);

export const config = {
  apiUrl,
  enableAIParsing: import.meta.env.VITE_ENABLE_AI_PARSING === 'true',
  showRawAIOutput: import.meta.env.VITE_SHOW_RAW_AI_OUTPUT === 'true',
  isReplit,
};

export default config;
