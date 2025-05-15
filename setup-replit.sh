#!/bin/bash

# setup-replit.sh
# Script to set up the project on Replit

echo "Setting up Job Application SaaS for Replit..."

# Check if running on Replit
if [ -z "$REPL_ID" ]; then
  echo "This script is designed to run on Replit only."
  exit 1
fi

# Rename Replit-specific package.json
echo "Configuring package.json for Replit..."
if [ -f "package.json.replit" ]; then
  mv package.json.replit package.json
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# Create required directories if they don't exist
echo "Creating required directories..."
mkdir -p tmp/uploads

# Initialize MongoDB or validate MongoDB connection
echo "Checking MongoDB connection..."
node -e "
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is not set!');
  console.error('Please set it in the Secrets tab on Replit.');
  process.exit(1);
}
mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connection successful!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection failed!', err.message);
    console.error('Please check your MONGODB_URI in the Secrets tab.');
    process.exit(1);
  });
"

# Set execute permissions for run.js
chmod +x run.js

echo "Setup complete! Run the application with 'npm start'"
