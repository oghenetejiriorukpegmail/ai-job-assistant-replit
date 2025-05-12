/**
 * Script to start MongoDB server
 * This script checks if MongoDB is running and starts it if not
 */

const { exec } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-saas';

// Check if MongoDB is running
async function checkMongoDBConnection() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    
    console.log('MongoDB is already running');
    mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('MongoDB is not running');
    return false;
  }
}

// Start MongoDB server
function startMongoDB() {
  console.log('Starting MongoDB server...');
  
  // Check operating system
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  
  let command;
  
  if (isWindows) {
    command = 'mongod --dbpath="C:\\data\\db"';
  } else if (isMac) {
    command = 'mongod --dbpath="/data/db"';
  } else if (isLinux) {
    command = 'mongod --dbpath="/var/lib/mongodb"';
  } else {
    console.error('Unsupported operating system');
    process.exit(1);
  }
  
  const mongoProcess = exec(command);
  
  mongoProcess.stdout.on('data', (data) => {
    console.log(`MongoDB: ${data}`);
  });
  
  mongoProcess.stderr.on('data', (data) => {
    console.error(`MongoDB Error: ${data}`);
  });
  
  mongoProcess.on('close', (code) => {
    console.log(`MongoDB process exited with code ${code}`);
  });
  
  // Return the process
  return mongoProcess;
}

// Main function
async function main() {
  const isRunning = await checkMongoDBConnection();
  
  if (!isRunning) {
    const mongoProcess = startMongoDB();
    
    // Wait for MongoDB to start
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        
        console.log('MongoDB started successfully');
        mongoose.connection.close();
        break;
      } catch (error) {
        retries++;
        console.log(`Waiting for MongoDB to start (${retries}/${maxRetries})...`);
        
        if (retries === maxRetries) {
          console.error('Failed to start MongoDB');
          mongoProcess.kill();
          process.exit(1);
        }
      }
    }
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkMongoDBConnection,
  startMongoDB
};
