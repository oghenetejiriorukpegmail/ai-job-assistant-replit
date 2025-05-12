#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p ./mongodb-data

# Pull MongoDB image
echo "Pulling MongoDB Docker image..."
docker pull mongo:latest

# Check if MongoDB container is already running
if docker ps | grep -q "mongodb-job-app"; then
    echo "MongoDB container is already running."
else
    # Start MongoDB container
    echo "Starting MongoDB container..."
    docker run -d \
        --name mongodb-job-app \
        -p 27017:27017 \
        -v "$(pwd)/mongodb-data:/data/db" \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password \
        mongo:latest
    
    # Wait for MongoDB to start
    echo "Waiting for MongoDB to start..."
    sleep 5
fi

# Create database and user
echo "Creating database and user..."
docker exec -it mongodb-job-app mongosh --eval "
    db = db.getSiblingDB('admin');
    db.auth('admin', 'password');
    
    db = db.getSiblingDB('job-application-saas');
    
    db.createUser({
        user: 'job-app-user',
        pwd: 'job-app-password',
        roles: [
            { role: 'readWrite', db: 'job-application-saas' }
        ]
    });
    
    db.createCollection('users');
    db.createCollection('resumes');
    db.createCollection('settings');
    db.createCollection('preferences');
    db.createCollection('jobs');
    db.createCollection('applications');
    
    print('Database and collections created successfully!');
"

# Update .env file
echo "Updating .env file..."
cat > backend/.env << EOL
PORT=5000
MONGODB_URI=mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
EOL

echo "MongoDB setup complete!"
echo "Connection string: mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas"
