# Job Board API Configuration Guide

This guide provides instructions for setting up and configuring the job board API integrations.

## Overview

The job application SaaS platform integrates with the following job board APIs:

1. LinkedIn Jobs API
2. Indeed API
3. Glassdoor API
4. Google Jobs API

Each API requires specific credentials and configuration. This guide will help you set up each integration.

## Environment Variables

All API credentials are stored in environment variables. Create or update your `.env` file with the following variables:

```
# LinkedIn API
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token

# Indeed API
INDEED_PUBLISHER_ID=your_publisher_id
INDEED_API_KEY=your_api_key

# Glassdoor API
GLASSDOOR_PARTNER_ID=your_partner_id
GLASSDOOR_API_KEY=your_api_key

# Google Jobs API
GOOGLE_API_KEY=your_api_key
```

## LinkedIn Jobs API Setup

### 1. Create a LinkedIn Developer Account

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Create a new app

### 2. Configure Your LinkedIn App

1. Set the app name and description
2. Add the redirect URLs for your application
3. Request the following permissions:
   - `r_emailaddress`
   - `r_liteprofile`
   - `r_fullprofile`
   - `r_ads`
   - `r_ads_reporting`
   - `rw_ads`
   - `w_member_social`

### 3. Get Access Credentials

1. Note your Client ID and Client Secret
2. Generate an Access Token using the OAuth 2.0 flow
3. Add these credentials to your `.env` file

## Indeed API Setup

### 1. Join the Indeed Publisher Program

1. Go to [Indeed Publisher Portal](https://www.indeed.com/publisher)
2. Sign up for a publisher account
3. Apply for API access

### 2. Get API Credentials

1. Once approved, you'll receive a Publisher ID
2. Generate an API key from your publisher dashboard
3. Add these credentials to your `.env` file

### 3. Configure API Settings

1. Set up allowed domains and IP addresses in your Indeed publisher settings
2. Configure rate limits according to your needs

## Glassdoor API Setup

### 1. Apply for Glassdoor API Access

1. Go to [Glassdoor Developers](https://www.glassdoor.com/developer/index.htm)
2. Fill out the application form for API access
3. Wait for approval (this may take several days)

### 2. Get API Credentials

1. Once approved, you'll receive a Partner ID and API Key
2. Add these credentials to your `.env` file

### 3. Configure API Settings

1. Set up allowed domains and IP addresses in your Glassdoor developer settings
2. Note the rate limits and usage restrictions

## Google Jobs API Setup

### 1. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Cloud Talent Solution API (formerly Google Jobs API)

### 2. Create API Credentials

1. Go to the Credentials section
2. Create an API Key
3. Add this API key to your `.env` file

### 3. Configure API Settings

1. Restrict the API key to only the Cloud Talent Solution API
2. Set up IP address restrictions if needed
3. Set up usage quotas according to your needs

## Testing Your Configuration

After setting up all the API credentials, you can test your configuration using the provided test script:

```bash
node src/scripts/test-job-integrations.js
```

This script will attempt to connect to each job board API and fetch a sample of jobs. Check the console output for any errors or warnings.

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: If you're seeing rate limit errors, adjust the rate limiter settings in `src/jobs/utils/rate-limiter.js`

2. **Authentication Failures**: Double-check your API credentials in the `.env` file

3. **Missing Permissions**: Ensure you've requested all necessary permissions for each API

4. **IP Restrictions**: Some APIs require whitelisting of IP addresses

### Logging

The job board integrations use a logging system to help with debugging. You can adjust the log level in your `.env` file:

```
LOG_LEVEL=DEBUG  # Options: ERROR, WARN, INFO, DEBUG
```

Logs will be output to the console and can help identify issues with the API integrations.

## Next Steps

Once you have successfully configured the job board APIs, you can:

1. Use the API endpoints to search for jobs
2. Set up scheduled job crawls to regularly fetch new jobs
3. Implement job matching based on user resumes and preferences

For more information, see the [Job Board API Documentation](../api/jobs-api.md).
