// MongoDB setup script for local MongoDB installation
// This script creates the necessary database and user for the application

// Connect to MongoDB
db = db.getSiblingDB('job-application-saas');

// Create user with read/write access
try {
  db.createUser({
    user: 'job-app-user',
    pwd: 'job-app-password',
    roles: [
      { role: 'readWrite', db: 'job-application-saas' }
    ]
  });
  print('User created successfully');
} catch (error) {
  print('User already exists or error creating user: ' + error.message);
}

// Create collections
try {
  db.createCollection('users');
  print('Users collection created');
} catch (error) {
  print('Users collection already exists or error: ' + error.message);
}

try {
  db.createCollection('resumes');
  print('Resumes collection created');
} catch (error) {
  print('Resumes collection already exists or error: ' + error.message);
}

try {
  db.createCollection('settings');
  print('Settings collection created');
} catch (error) {
  print('Settings collection already exists or error: ' + error.message);
}

try {
  db.createCollection('preferences');
  print('Preferences collection created');
} catch (error) {
  print('Preferences collection already exists or error: ' + error.message);
}

try {
  db.createCollection('jobs');
  print('Jobs collection created');
} catch (error) {
  print('Jobs collection already exists or error: ' + error.message);
}

try {
  db.createCollection('applications');
  print('Applications collection created');
} catch (error) {
  print('Applications collection already exists or error: ' + error.message);
}

print('Database setup complete!');
