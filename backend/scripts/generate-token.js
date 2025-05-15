/**
 * Script to generate a JWT token for testing
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../src/models');

// Secret to use
const JWT_SECRET = 'ABCDEFGhijkLMNOPqrsTUvwxYZ123456789';

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-saas')
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '24h'
    });
    
    console.log('Generated token:');
    console.log(token);
    
    // Test verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('\nVerification successful!');
      console.log('Decoded token:', decoded);
    } catch (err) {
      console.log('\nVerification failed:', err.message);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
