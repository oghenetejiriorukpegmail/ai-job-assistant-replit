# Job Application SaaS Tool

A secure, modular SaaS platform to automate job search and application processes.

---

## Features

- User registration and login (JWT-based)
- User profile management
- Resume upload and parsing (PDF/DOCX)
- Matching preference wizard
- Job board integrations (LinkedIn, Indeed, Glassdoor, Google Jobs)
- Job matching algorithms (resume-based and title-based)
- Job search with filtering and sorting
- Scheduled job crawling
- Modular React frontend
- Security-first design
- Comprehensive documentation

---

## Tech Stack

- **Backend:** Node.js, Express, JWT, bcrypt, multer, pdf-parse
- **Frontend:** React, Vite
- **Database:** MongoDB with in-memory fallback
- **AI Integration:** Google Gemini API
- **Job APIs:** LinkedIn Jobs API, Indeed API, Glassdoor API, Google Jobs API

---

## Setup Instructions

### Prerequisites

- Node.js (v16+ recommended)
- Git

### Clone the repository

```bash
git clone https://github.com/oghenetejiriorukpegmail/job-application-saas.git
cd job-application-saas
```

### Configure environment variables

- Copy `.env.example` to `.env`
- Update secrets as needed

#### Required environment variables:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/job-application-saas

# JWT Secret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI Integration
GOOGLE_API_KEY=your_google_api_key

# Job Board APIs (optional, but required for job integrations)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token

INDEED_PUBLISHER_ID=your_indeed_publisher_id
INDEED_API_KEY=your_indeed_api_key

GLASSDOOR_PARTNER_ID=your_glassdoor_partner_id
GLASSDOOR_API_KEY=your_glassdoor_api_key

GOOGLE_API_KEY=your_google_api_key  # Same key used for Google Jobs API
```

### Install dependencies

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all
```

### Set up MongoDB (Optional)

You have several options for setting up MongoDB:

#### Option 1: Use Docker (Recommended)

```bash
npm run setup:mongodb:docker
```

This will:
- Pull the MongoDB Docker image
- Start a MongoDB container
- Create the necessary database and user
- Update the `.env` file with the connection string

#### Option 2: Install MongoDB locally on Windows

```bash
npm run setup:mongodb:windows
```

This will:
- Check if MongoDB is installed
- Start the MongoDB service
- Create the necessary database and user
- Update the `.env` file with the connection string

#### Option 3: Use MongoDB Atlas (Cloud)

Follow the instructions in `setup-mongodb-atlas.md` to set up a free MongoDB Atlas cluster.

### Run the application

```bash
# Development mode with MongoDB (recommended)
npm run dev:with-db

# OR Development mode with in-memory fallback
npm run dev

# OR Production mode (after building)
npm run build
npm run prod

# OR Using the combined launcher script
npm start
```

The application will automatically open in your default browser.

### Individual component commands

```bash
# Run only the backend (development mode)
npm run dev:backend

# Run only the frontend (development mode)
npm run dev:frontend

# Build the frontend
npm run build

# Run only the backend (production mode)
npm run prod:backend

# Run only the frontend (production mode)
npm run prod:frontend
```

---

## Security Notes

- JWT secrets should be kept safe in `.env`
- Passwords are hashed with bcrypt
- Input validation and error handling throughout
- CORS and rate limiting enabled
- Avoid storing JWT in localStorage (stored in memory)

---

## Future Enhancements

- Enhanced job matching algorithms with NLP/ML
- Web scraping fallback for job boards without APIs
- AI-powered resume and cover letter generation
- Job application tracking and management
- Email notifications for new job matches
- Deployment and scaling
- CI/CD pipelines
- Monitoring and alerts
- Migration to PostgreSQL (if needed for complex queries)

---

## License

Proprietary - All rights reserved.