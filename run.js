/**
 * Job Application SaaS - Replit Launcher Script
 * 
 * This script launches both the frontend and backend services.
 * Adapted specially for Replit environment.
 */

const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Check if running on Replit
const isReplit = process.env.REPL_ID !== undefined;

// Configuration
const config = {
  frontend: {
    dev: {
      command: 'npm',
      args: ['run', 'dev'],
      cwd: path.join(__dirname, 'frontend'),
      color: '\x1b[36m', // Cyan
    },
    prod: {
      command: 'npm',
      args: ['run', 'preview'],
      cwd: path.join(__dirname, 'frontend'),
      color: '\x1b[36m', // Cyan
    }
  },
  backend: {
    dev: {
      command: 'npm',
      args: ['run', 'dev'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[33m', // Yellow
    },
    prod: {
      command: 'npm',
      args: ['start'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[33m', // Yellow
    }
  }
};

// Replit-specific configuration
if (isReplit) {
  // Update CORS settings in backend for Replit environment
  const replitUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  
  // Create Replit-specific environment variables
  const replitEnv = {
    PORT: process.env.PORT || 3000,
    VITE_API_URL: replitUrl,
    // Use MongoDB URI from Replit environment or default to MongoDB Atlas if provided
    MONGODB_URI: process.env.MONGODB_URI || process.env.REPLIT_MONGO_URI || 'mongodb://localhost:27017/job-application-saas',
    // Generate a random JWT secret if not provided
    JWT_SECRET: process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex'),
    // Set proper NODE_ENV based on context
    NODE_ENV: process.env.NODE_ENV || 'production',
  };
  
  // Write Replit-specific environment variables
  let envContent = '# Replit Environment Variables\n';
  Object.entries(replitEnv).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
    // Also set in current process.env
    process.env[key] = value;
  });
  
  // Save to .env file for persistence across restarts
  fs.writeFileSync('.env', envContent);
  
  console.log(`\x1b[32m[Replit Config]\x1b[0m Environment configured for Replit`);
}

// Determine environment
const isProd = process.env.NODE_ENV === 'production' || isReplit;
const mode = isProd ? 'prod' : 'dev';
console.log(`\x1b[32m[Launcher]\x1b[0m Starting in ${isProd ? 'production' : 'development'} mode`);

// Function to start a service
function startService(service, serviceConfig) {
  console.log(`\x1b[32m[Launcher]\x1b[0m Starting ${service}...`);
  
  const process = spawn(
    serviceConfig.command,
    serviceConfig.args,
    { 
      cwd: serviceConfig.cwd, 
      stdio: 'pipe',
      env: { ...process.env }
    }
  );
  
  // Handle stdout
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${serviceConfig.color}[${service}]\x1b[0m ${line}`);
      }
    });
  });
  
  // Handle stderr
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${serviceConfig.color}[${service}]\x1b[0m \x1b[31m${line}\x1b[0m`);
      }
    });
  });
  
  // Handle process exit
  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`\x1b[31m[Launcher]\x1b[0m ${service} process exited with code ${code}`);
    }
  });
  
  return process;
}

// Start backend
const backendProcess = startService('Backend', config.backend[mode]);

// On Replit, only start backend or use a different strategy
if (!isReplit) {
  // Start frontend locally
  const frontendProcess = startService('Frontend', config.frontend[mode]);
  
  // Handle script termination
  process.on('SIGINT', () => {
    console.log('\n\x1b[32m[Launcher]\x1b[0m Shutting down services...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
} else {
  // For Replit, we'll build the frontend first and let the backend serve it
  console.log(`\x1b[32m[Replit]\x1b[0m Building frontend...`);
  const buildProcess = spawn(
    'npm',
    ['run', 'build'],
    { 
      cwd: path.join(__dirname, 'frontend'), 
      stdio: 'pipe',
      env: { ...process.env }
    }
  );
  
  buildProcess.stdout.on('data', (data) => {
    console.log(`\x1b[36m[Frontend Build]\x1b[0m ${data.toString().trim()}`);
  });
  
  buildProcess.stderr.on('data', (data) => {
    console.log(`\x1b[36m[Frontend Build]\x1b[0m \x1b[31m${data.toString().trim()}\x1b[0m`);
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`\x1b[32m[Replit]\x1b[0m Frontend built successfully. Backend is serving the app.`);
      console.log(`\x1b[32m[Replit]\x1b[0m App is running at: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    } else {
      console.log(`\x1b[31m[Replit]\x1b[0m Frontend build failed with code ${code}`);
    }
  });
  
  // Handle script termination
  process.on('SIGINT', () => {
    console.log('\n\x1b[32m[Launcher]\x1b[0m Shutting down services...');
    backendProcess.kill();
    process.exit(0);
  });
}
