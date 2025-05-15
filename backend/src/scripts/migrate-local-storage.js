/**
 * Data migration script to move data from localStorage to MongoDB
 * This script can be run on the client side to export localStorage data
 * and then imported into MongoDB
 */

// This script would be run in the browser console to export localStorage data
function exportLocalStorageData() {
  const data = {
    users: [],
    resumes: [],
    settings: [],
    preferences: [],
    jobs: []
  };

  // Get JWT token
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    console.error('No JWT token found. User must be logged in.');
    return null;
  }

  // Parse JWT token to get user ID
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    const userId = payload.userId;

    // Get user profile
    const userProfile = localStorage.getItem('user_profile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      data.users.push({
        _id: userId,
        ...profile
      });
    }

    // Get resume data
    const resumeData = localStorage.getItem('user_resumes');
    if (resumeData) {
      const resume = JSON.parse(resumeData);
      if (resume) {
        data.resumes.push({
          userId,
          ...resume
        });
      }
    }

    // Get settings
    const settingsData = localStorage.getItem('app_settings');
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings) {
        data.settings.push({
          userId,
          ...settings
        });
      }
    }

    // Get preferences
    const preferencesData = localStorage.getItem('user_preferences');
    if (preferencesData) {
      const preferences = JSON.parse(preferencesData);
      if (preferences) {
        data.preferences.push({
          userId,
          ...preferences
        });
      }
    }

    // Get jobs
    const jobsData = localStorage.getItem('saved_jobs');
    if (jobsData) {
      const jobs = JSON.parse(jobsData);
      if (jobs && Array.isArray(jobs)) {
        data.jobs = jobs.map(job => ({
          ...job,
          userId
        }));
      }
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localStorage-export.json';
    a.click();
    
    return data;
  } catch (error) {
    console.error('Error exporting localStorage data:', error);
    return null;
  }
}

// This would be run on the server to import the data into MongoDB
async function importDataToMongoDB(data) {
  const mongoose = require('mongoose');
  const { User, Resume, Setting, Preference, Job } = require('../models');
  const connectDB = require('../config/database');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Import users
    if (data.users && data.users.length > 0) {
      for (const userData of data.users) {
        const { _id, ...userFields } = userData;
        
        // Check if user exists
        const existingUser = await User.findById(_id);
        if (existingUser) {
          // Update existing user
          Object.assign(existingUser, userFields);
          await existingUser.save();
        } else {
          // Create new user
          const newUser = new User({
            _id,
            ...userFields
          });
          await newUser.save();
        }
      }
      console.log(`Imported ${data.users.length} users`);
    }
    
    // Import resumes
    if (data.resumes && data.resumes.length > 0) {
      for (const resumeData of data.resumes) {
        const { userId, ...resumeFields } = resumeData;
        
        // Create new resume
        const newResume = new Resume({
          userId,
          ...resumeFields
        });
        await newResume.save();
      }
      console.log(`Imported ${data.resumes.length} resumes`);
    }
    
    // Import settings
    if (data.settings && data.settings.length > 0) {
      for (const settingData of data.settings) {
        const { userId, ...settingFields } = settingData;
        
        // Check if settings exist
        const existingSettings = await Setting.findOne({ userId });
        if (existingSettings) {
          // Update existing settings
          Object.assign(existingSettings, settingFields);
          await existingSettings.save();
        } else {
          // Create new settings
          const newSettings = new Setting({
            userId,
            ...settingFields
          });
          await newSettings.save();
        }
      }
      console.log(`Imported ${data.settings.length} settings`);
    }
    
    // Import preferences
    if (data.preferences && data.preferences.length > 0) {
      for (const preferenceData of data.preferences) {
        const { userId, ...preferenceFields } = preferenceData;
        
        // Check if preferences exist
        const existingPreferences = await Preference.findOne({ userId });
        if (existingPreferences) {
          // Update existing preferences
          Object.assign(existingPreferences, preferenceFields);
          await existingPreferences.save();
        } else {
          // Create new preferences
          const newPreferences = new Preference({
            userId,
            ...preferenceFields
          });
          await newPreferences.save();
        }
      }
      console.log(`Imported ${data.preferences.length} preferences`);
    }
    
    // Import jobs
    if (data.jobs && data.jobs.length > 0) {
      for (const jobData of data.jobs) {
        const { userId, ...jobFields } = jobData;
        
        // Create new job
        const newJob = new Job({
          userId,
          ...jobFields
        });
        await newJob.save();
      }
      console.log(`Imported ${data.jobs.length} jobs`);
    }
    
    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Error importing data to MongoDB:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
}

// Export functions
module.exports = {
  importDataToMongoDB
};

// If this script is run directly
if (require.main === module) {
  // Check if file path is provided
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a file path to the exported localStorage data');
    process.exit(1);
  }
  
  // Read file
  const fs = require('fs');
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    importDataToMongoDB(data)
      .then(() => {
        console.log('Data migration completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('Error during data migration:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error reading file:', error);
    process.exit(1);
  }
}
