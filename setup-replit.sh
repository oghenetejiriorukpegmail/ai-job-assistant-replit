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

# Check if we're using Replit Database
echo "Setting up database..."
# No need to configure MongoDB as we're using Replit Database

# Set execute permissions for run.js
chmod +x run.js

echo "Setup complete! Run the application with 'npm start'"

