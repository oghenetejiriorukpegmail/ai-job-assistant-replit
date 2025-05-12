/**
 * Job Application SaaS - Combined Launcher Script
 * 
 * This script launches both the frontend and backend services with a single command.
 * It also opens the application in the default browser.
 * 
 * Usage:
 *   - Development mode: npm run dev
 *   - Production mode: npm run prod
 *   - Start with this script: npm start
 */

const { spawn } = require('child_process');
const path = require('path');
const open = require('open');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const config = {
  frontend: {
    dev: {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', 'dev'],
      cwd: path.join(__dirname, 'frontend'),
      color: '\x1b[36m', // Cyan
    },
    prod: {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', 'preview'],
      cwd: path.join(__dirname, 'frontend'),
      color: '\x1b[36m', // Cyan
    }
  },
  backend: {
    dev: {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', 'dev'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[33m', // Yellow
    },
    prod: {
      command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['start'],
      cwd: path.join(__dirname, 'backend'),
      color: '\x1b[33m', // Yellow
    }
  },
  frontendUrl: 'http://localhost:5173',
  backendUrl: 'http://localhost:5000',
};

// Determine environment
const isProd = process.env.NODE_ENV === 'production';
const mode = isProd ? 'prod' : 'dev';
console.log(`\x1b[32m[Launcher]\x1b[0m Starting in ${isProd ? 'production' : 'development'} mode`);

// Function to start a service
function startService(service, serviceConfig) {
  console.log(`\x1b[32m[Launcher]\x1b[0m Starting ${service}...`);
  
  const process = spawn(
    serviceConfig.command,
    serviceConfig.args,
    { cwd: serviceConfig.cwd, stdio: 'pipe' }
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

// Start frontend
const frontendProcess = startService('Frontend', config.frontend[mode]);

// Open browser after a delay to allow services to start
setTimeout(() => {
  console.log(`\x1b[32m[Launcher]\x1b[0m Opening application in browser...`);
  open(config.frontendUrl);
}, 5000);

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\x1b[32m[Launcher]\x1b[0m Shutting down services...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});
