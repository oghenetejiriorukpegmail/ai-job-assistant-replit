# Job Application SaaS Backend

This is the backend for the Job Application SaaS platform. It provides APIs for user authentication, resume parsing, job matching, and more.

## Database Setup

The application uses MongoDB for data persistence. If MongoDB is not available, it will fall back to in-memory storage, but data will not persist after server restart.

### Setting up MongoDB

1. Install MongoDB on your system:
   - Windows: [MongoDB Windows Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - macOS: [MongoDB macOS Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-macos/)
   - Linux: [MongoDB Linux Installation Guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Create a data directory for MongoDB:
   - Windows: `C:\data\db`
   - macOS/Linux: `/data/db`

3. Start MongoDB:
   - Windows: `mongod --dbpath="C:\data\db"`
   - macOS/Linux: `mongod --dbpath="/data/db"`

4. Verify MongoDB is running:
   ```
   mongo
   ```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-application-saas
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Running the Application

### With MongoDB

```
npm run dev-with-db
```

This will start MongoDB and the backend server.

### Without MongoDB (Fallback Mode)

```
npm run dev
```

This will start the backend server in fallback mode, using in-memory storage.

## Data Migration

If you have data in localStorage that you want to migrate to MongoDB:

1. Export data from localStorage:
   - Open the browser console on the frontend
   - Run the `exportLocalStorageData()` function from the browser console
   - This will download a JSON file with your localStorage data

2. Import data to MongoDB:
   ```
   npm run migrate path/to/exported-data.json
   ```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings
- `POST /api/resumes/upload` - Upload and parse a resume
- `POST /api/resumes/upload/ai` - Upload and parse a resume using AI
- `GET /api/resumes/:id` - Get a specific resume
- `GET /api/resumes/user` - Get all resumes for the current user
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Save user preferences
- `GET /api/jobs/match` - Get matched jobs

## Health Check

- `GET /api/health` - Check if the API is running and get database status
