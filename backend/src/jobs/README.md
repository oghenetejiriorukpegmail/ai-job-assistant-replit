# Job Board Integrations

This module provides integration with various job board APIs to fetch job listings and match them with user resumes and preferences.

## Features

- Integration with multiple job board APIs (LinkedIn, Indeed, Glassdoor, Google Jobs)
- Job deduplication to prevent duplicate entries
- Rate limiting to respect API usage limits
- Scheduled job crawling with configurable intervals
- Job matching based on resume skills or job titles
- Search and filtering capabilities

## Architecture

The job board integration system consists of the following components:

### Integrations

Located in `src/jobs/integrations/`, these modules handle the communication with specific job board APIs:

- `linkedin.js`: LinkedIn Jobs API integration
- `indeed.js`: Indeed Jobs API integration
- `glassdoor.js`: Glassdoor Jobs API integration
- `google-jobs.js`: Google Jobs API integration
- `index.js`: Unified interface for all integrations

### Services

Located in `src/jobs/services/`, these modules provide business logic for job operations:

- `job-service.js`: Service for job operations (search, match, etc.)
- `crawler-service.js`: Service for scheduling and executing job crawls

### Utilities

Located in `src/jobs/utils/`, these modules provide utility functions:

- `deduplication.js`: Utilities for detecting and handling duplicate job listings
- `rate-limiter.js`: Rate limiting functionality for API calls

### Controllers and Routes

- `jobs.controller.js`: Controller for job-related API requests
- `jobs.routes.js`: Routes for job-related API endpoints

## API Endpoints

### Job Search and Matching

- `GET /api/jobs/search`: Search for jobs with filtering and pagination
- `GET /api/jobs/:id`: Get a job by ID
- `GET /api/jobs/:id/similar`: Get similar jobs based on a job ID
- `GET /api/jobs/match`: Get matched jobs based on user preferences and resume

### Job Crawling (Admin)

- `POST /api/jobs/crawl`: Start a job crawl
- `GET /api/jobs/crawl/:id`: Get crawl status
- `GET /api/jobs/crawl`: Get active crawls
- `POST /api/jobs/schedule`: Schedule a recurring crawl
- `DELETE /api/jobs/schedule/:id`: Cancel a scheduled crawl
- `GET /api/jobs/schedule`: Get scheduled crawls

## Configuration

### Environment Variables

The following environment variables are required for the job board integrations:

#### LinkedIn API
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
```

#### Indeed API
```
INDEED_PUBLISHER_ID=your_publisher_id
INDEED_API_KEY=your_api_key
```

#### Glassdoor API
```
GLASSDOOR_PARTNER_ID=your_partner_id
GLASSDOOR_API_KEY=your_api_key
```

#### Google Jobs API
```
GOOGLE_API_KEY=your_api_key
```

### Rate Limiting Configuration

Rate limits can be configured in `src/jobs/utils/rate-limiter.js`:

```javascript
const rateLimiters = {
  linkedin: createRateLimiter('linkedin', 100, 60 * 60 * 1000), // 100 calls per hour
  indeed: createRateLimiter('indeed', 50, 60 * 60 * 1000),      // 50 calls per hour
  glassdoor: createRateLimiter('glassdoor', 30, 60 * 60 * 1000), // 30 calls per hour
  googleJobs: createRateLimiter('googleJobs', 100, 60 * 60 * 1000) // 100 calls per hour
};
```

## Usage Examples

### Fetching Jobs from a Specific Source

```javascript
const jobIntegrations = require('./jobs/integrations');

// Options for job search
const options = {
  keywords: 'software engineer',
  location: 'remote',
  limit: 20
};

// Fetch jobs from LinkedIn
const linkedinJobs = await jobIntegrations.fetchJobsFromSource('linkedin', options);

// Fetch jobs from all sources
const allJobs = await jobIntegrations.fetchJobsFromAllSources(options);
```

### Matching Jobs with Resume Skills

```javascript
const jobService = require('./jobs/services/job-service');

// User's skills from resume
const skills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];

// Match jobs based on skills
const matchedJobs = await jobService.matchJobsBySkills(skills, 10);
```

### Scheduling a Recurring Crawl

```javascript
const crawlerService = require('./jobs/services/crawler-service');

// Schedule a daily crawl for software engineering jobs
const scheduledCrawl = crawlerService.scheduleRecurringCrawl({
  source: 'all',
  searchParams: {
    keywords: 'software engineer',
    location: 'remote'
  },
  intervalMinutes: 60 * 24 // Once a day
});
```

## Testing

A test script is provided to verify the job board integrations:

```bash
node src/scripts/test-job-integrations.js
```

This script tests each integration by fetching jobs and logging the results.
