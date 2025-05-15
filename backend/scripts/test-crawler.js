/**
 * Script to test the LinkedIn crawler directly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const linkedinIntegration = require('../src/jobs/integrations/mock-linkedin');
const logger = require('../src/utils/logger');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-saas')
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      console.log('Testing LinkedIn crawler...');

      // Test if LinkedIn API is configured
      const isConfigured = linkedinIntegration.isConfigured();
      console.log('LinkedIn API configured:', isConfigured);

      // Search parameters
      const searchParams = {
        keywords: 'network engineer',
        location: 'remote',
        limit: 5
      };

      console.log('Searching for jobs with params:', searchParams);

      // Fetch jobs
      const jobs = await linkedinIntegration.fetchJobs(searchParams);

      console.log(`Found ${jobs.length} jobs`);

      if (jobs.length > 0) {
        console.log('First job:', JSON.stringify(jobs[0], null, 2));
      }

      process.exit(0);
    } catch (error) {
      console.error('Error testing LinkedIn crawler:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
