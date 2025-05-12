@echo off
setlocal

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker first.
    echo Visit https://docs.docker.com/get-docker/ for installation instructions.
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Create data directory if it doesn't exist
mkdir mongodb-data 2>nul

REM Pull MongoDB image
echo Pulling MongoDB Docker image...
docker pull mongo:latest

REM Check if MongoDB container is already running
docker ps | findstr "mongodb-job-app" >nul
if %ERRORLEVEL% equ 0 (
    echo MongoDB container is already running.
) else (
    REM Start MongoDB container
    echo Starting MongoDB container...
    docker run -d ^
        --name mongodb-job-app ^
        -p 27017:27017 ^
        -v "%cd%\mongodb-data:/data/db" ^
        -e MONGO_INITDB_ROOT_USERNAME=admin ^
        -e MONGO_INITDB_ROOT_PASSWORD=password ^
        mongo:latest
    
    REM Wait for MongoDB to start
    echo Waiting for MongoDB to start...
    timeout /t 5 /nobreak >nul
)

REM Create database and user
echo Creating database and user...
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

REM Update .env file
echo Updating .env file...
(
    echo PORT=5000
    echo MONGODB_URI=mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas
    echo JWT_SECRET=your-secret-key-change-in-production
    echo OPENAI_API_KEY=your-openai-api-key
    echo GOOGLE_API_KEY=your-google-api-key
    echo OPENROUTER_API_KEY=your-openrouter-api-key
) > backend\.env

echo MongoDB setup complete!
echo Connection string: mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas

endlocal
