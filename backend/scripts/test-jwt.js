/**
 * Script to test JWT verification
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.error('Please provide a JWT token');
  process.exit(1);
}

// Try different JWT secrets
const secrets = [
  process.env.JWT_SECRET,
  'ABCDEFGhijkLMNOPqrsTUvwxYZ123456789',
  'your_jwt_secret_key',
  'your-secret-key-change-in-production'
];

console.log('Testing JWT verification with different secrets:');

secrets.forEach((secret, index) => {
  console.log(`\nSecret ${index + 1}: ${secret}`);
  
  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Verification successful!');
    console.log('Decoded token:', decoded);
  } catch (err) {
    console.log('❌ Verification failed:', err.message);
  }
});
