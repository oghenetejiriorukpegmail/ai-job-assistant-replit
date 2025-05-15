/**
 * Script to make a user an admin
 * Run with: node scripts/make-admin.js <email>
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { User } = require('../src/models');

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
    
    // Update user roles to include admin
    user.roles = ['user', 'admin'];
    await user.save();
    
    console.log(`User ${email} is now an admin`);
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
