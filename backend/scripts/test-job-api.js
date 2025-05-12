/**
 * Script to test job search APIs
 */

require('dotenv').config();
const axios = require('axios');

// Test job search using a public API
async function testJobSearch() {
  try {
    console.log('Testing job search API...');
    
    // Search parameters
    const query = 'network engineer';
    const location = 'remote';
    
    // Make the request to a public job search API
    // This is the Remotive API which is publicly accessible
    const response = await axios.get('https://remotive.com/api/remote-jobs', {
      params: {
        search: query,
        limit: 10
      }
    });
    
    // Check response
    if (response.data && response.data.jobs) {
      console.log(`Found ${response.data.jobs.length} job results`);
      
      // Display first result
      if (response.data.jobs.length > 0) {
        const firstResult = response.data.jobs[0];
        console.log('First result:');
        console.log('- Title:', firstResult.title);
        console.log('- Company:', firstResult.company_name);
        console.log('- Location:', firstResult.candidate_required_location);
        console.log('- Link:', firstResult.url);
        console.log('- Description:', firstResult.description?.slice(0, 100) + '...');
      }
    } else {
      console.log('No job results found or invalid response format');
      console.log('Response structure:', Object.keys(response.data));
    }
  } catch (error) {
    console.error('Error testing job search API:', error.response?.data || error.message);
  }
}

// Run the test
testJobSearch()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
