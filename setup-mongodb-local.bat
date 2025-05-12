@echo off
echo Setting up MongoDB for job-application-saas...

REM Find MongoDB installation path
for /f "tokens=*" %%a in ('where mongod 2^>nul') do set MONGOD_PATH=%%a
if "%MONGOD_PATH%"=="" (
    echo MongoDB executable not found in PATH.
    echo Checking common installation locations...
    
    if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongosh.exe" (
        set MONGOSH_PATH="C:\Program Files\MongoDB\Server\6.0\bin\mongosh.exe"
    ) else if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongosh.exe" (
        set MONGOSH_PATH="C:\Program Files\MongoDB\Server\5.0\bin\mongosh.exe"
    ) else if exist "C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe" (
        set MONGOSH_PATH="C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe"
    ) else (
        echo MongoDB shell not found in common locations.
        echo Please make sure MongoDB is installed and the bin directory is in your PATH.
        exit /b 1
    )
) else (
    for /f "tokens=*" %%a in ('where mongosh 2^>nul') do set MONGOSH_PATH=%%a
    if "%MONGOSH_PATH%"=="" (
        for /f "tokens=*" %%a in ('where mongo 2^>nul') do set MONGOSH_PATH=%%a
    )
)

echo Using MongoDB shell: %MONGOSH_PATH%

REM Run the MongoDB setup script
echo Running MongoDB setup script...
%MONGOSH_PATH% --quiet --file setup-mongodb-local.js

REM Update .env file
echo Updating .env file...
(
    echo PORT=5000
    echo MONGODB_URI=mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas?authSource=job-application-saas
    echo JWT_SECRET=your-secret-key-change-in-production
    echo OPENAI_API_KEY=your-openai-api-key
    echo GOOGLE_API_KEY=your-google-api-key
    echo OPENROUTER_API_KEY=your-openrouter-api-key
) > backend\.env

echo MongoDB setup complete!
echo Connection string: mongodb://job-app-user:job-app-password@localhost:27017/job-application-saas?authSource=job-application-saas
