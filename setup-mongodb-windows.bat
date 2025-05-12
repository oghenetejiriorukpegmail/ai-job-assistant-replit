@echo off
setlocal

REM Create data directory if it doesn't exist
mkdir C:\data\db 2>nul

REM Check if MongoDB is already installed
mongod --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo MongoDB is already installed.
) else (
    echo MongoDB is not installed.
    echo Please download and install MongoDB from:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo After installation, run this script again.
    start https://www.mongodb.com/try/download/community
    exit /b 1
)

REM Start MongoDB service
echo Starting MongoDB service...
net start MongoDB
if %ERRORLEVEL% neq 0 (
    echo MongoDB service not found. Starting MongoDB manually...
    start "MongoDB" mongod --dbpath="C:\data\db"
    timeout /t 5 /nobreak >nul
)

REM Create database and user
echo Creating database and user...
mongosh --eval "
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
