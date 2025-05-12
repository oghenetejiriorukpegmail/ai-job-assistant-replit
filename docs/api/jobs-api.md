# Job Board API Documentation

This document provides detailed information about the job board API endpoints.

## Job Search and Matching

### Search Jobs

```
GET /api/jobs/search
```

Search for jobs with filtering and pagination.

#### Query Parameters

| Parameter  | Type    | Description                                      |
|------------|---------|--------------------------------------------------|
| keywords   | string  | Search keywords                                  |
| location   | string  | Job location                                     |
| company    | string  | Company name                                     |
| source     | string  | Job source (linkedin, indeed, glassdoor, google) |
| minSalary  | number  | Minimum salary                                   |
| maxSalary  | number  | Maximum salary                                   |
| jobType    | string  | Job type (full-time, part-time, contract, etc.)  |
| remote     | boolean | Remote job flag                                  |
| skills     | array   | Required skills                                  |
| page       | number  | Page number (default: 1)                         |
| limit      | number  | Results per page (default: 20)                   |
| sort       | string  | Sort order (recent, salary, title, company)      |

#### Response

```json
{
  "jobs": [
    {
      "_id": "60f1b5b3e6b3f32d8c9e4b1a",
      "title": "Software Engineer",
      "company": "Tech Company",
      "location": "San Francisco, CA",
      "description": "Job description...",
      "url": "https://example.com/job/123",
      "salary": "100000-120000 USD",
      "source": "linkedin",
      "sourceId": "123456",
      "postedDate": "2023-07-15T00:00:00.000Z",
      "skills": ["JavaScript", "React", "Node.js"],
      "remote": true,
      "jobType": "full-time"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

### Get Job by ID

```
GET /api/jobs/:id
```

Get a job by ID.

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | string | Job ID      |

#### Response

```json
{
  "_id": "60f1b5b3e6b3f32d8c9e4b1a",
  "title": "Software Engineer",
  "company": "Tech Company",
  "location": "San Francisco, CA",
  "description": "Job description...",
  "url": "https://example.com/job/123",
  "salary": "100000-120000 USD",
  "source": "linkedin",
  "sourceId": "123456",
  "postedDate": "2023-07-15T00:00:00.000Z",
  "skills": ["JavaScript", "React", "Node.js"],
  "remote": true,
  "jobType": "full-time"
}
```

### Get Similar Jobs

```
GET /api/jobs/:id/similar
```

Get similar jobs based on a job ID.

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | string | Job ID      |

#### Query Parameters

| Parameter | Type   | Description                     |
|-----------|--------|---------------------------------|
| limit     | number | Maximum number of results (default: 5) |

#### Response

```json
[
  {
    "_id": "60f1b5b3e6b3f32d8c9e4b1b",
    "title": "Frontend Developer",
    "company": "Another Tech Company",
    "location": "San Francisco, CA",
    "description": "Job description...",
    "url": "https://example.com/job/124",
    "salary": "90000-110000 USD",
    "source": "indeed",
    "sourceId": "789012",
    "postedDate": "2023-07-14T00:00:00.000Z",
    "skills": ["JavaScript", "React", "CSS"],
    "remote": true,
    "jobType": "full-time"
  }
]
```

### Get Matched Jobs

```
GET /api/jobs/match
```

Get matched jobs based on user preferences and resume.

#### Response

```json
[
  {
    "_id": "60f1b5b3e6b3f32d8c9e4b1a",
    "title": "Software Engineer",
    "company": "Tech Company",
    "location": "San Francisco, CA",
    "description": "Job description...",
    "url": "https://example.com/job/123",
    "salary": "100000-120000 USD",
    "source": "linkedin",
    "sourceId": "123456",
    "postedDate": "2023-07-15T00:00:00.000Z",
    "skills": ["JavaScript", "React", "Node.js"],
    "remote": true,
    "jobType": "full-time",
    "score": 85,
    "matchingSkills": ["JavaScript", "React"]
  }
]
```

## Job Crawling (Admin)

### Start Job Crawl

```
POST /api/jobs/crawl
```

Start a job crawl.

#### Request Body

```json
{
  "source": "linkedin",  // or "indeed", "glassdoor", "google", "all"
  "searchParams": {
    "keywords": "software engineer",
    "location": "remote",
    "limit": 20
  },
  "saveJobs": true
}
```

#### Response

```json
{
  "id": "crawl-1626345678901",
  "source": "linkedin",
  "status": "running",
  "startTime": "2023-07-15T12:34:56.789Z"
}
```

### Get Crawl Status

```
GET /api/jobs/crawl/:id
```

Get crawl status.

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | string | Crawl ID    |

#### Response

```json
{
  "id": "crawl-1626345678901",
  "source": "linkedin",
  "status": "completed",
  "startTime": "2023-07-15T12:34:56.789Z",
  "endTime": "2023-07-15T12:35:56.789Z",
  "result": {
    "total": 20,
    "saved": 18,
    "duplicates": 2,
    "errors": 0
  }
}
```

### Get Active Crawls

```
GET /api/jobs/crawl
```

Get active crawls.

#### Response

```json
[
  {
    "id": "crawl-1626345678901",
    "source": "linkedin",
    "status": "running",
    "startTime": "2023-07-15T12:34:56.789Z"
  }
]
```

### Schedule Recurring Crawl

```
POST /api/jobs/schedule
```

Schedule a recurring crawl.

#### Request Body

```json
{
  "source": "all",
  "searchParams": {
    "keywords": "software engineer",
    "location": "remote",
    "limit": 20
  },
  "intervalMinutes": 1440  // 24 hours
}
```

#### Response

```json
{
  "id": "schedule-1626345678901",
  "source": "all",
  "intervalMinutes": 1440,
  "nextRun": "2023-07-16T12:34:56.789Z"
}
```

### Cancel Scheduled Crawl

```
DELETE /api/jobs/schedule/:id
```

Cancel a scheduled crawl.

#### URL Parameters

| Parameter | Type   | Description  |
|-----------|--------|--------------|
| id        | string | Schedule ID  |

#### Response

```json
{
  "success": true
}
```

### Get Scheduled Crawls

```
GET /api/jobs/schedule
```

Get scheduled crawls.

#### Response

```json
[
  {
    "id": "schedule-1626345678901",
    "source": "all",
    "status": "scheduled",
    "intervalMinutes": 1440,
    "lastRun": "2023-07-15T12:34:56.789Z",
    "nextRun": "2023-07-16T12:34:56.789Z"
  }
]
```
