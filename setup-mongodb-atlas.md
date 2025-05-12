# Setting up MongoDB Atlas

MongoDB Atlas is a cloud-hosted MongoDB service that eliminates the need to install and manage MongoDB locally. Follow these steps to set up MongoDB Atlas for your application:

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account

## 2. Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose the "FREE" tier
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your location
5. Click "Create Cluster" (this may take a few minutes)

## 3. Set Up Database Access

1. In the left sidebar, click "Database Access" under "Security"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and password (remember these for your connection string)
5. Set "Database User Privileges" to "Atlas admin"
6. Click "Add User"

## 4. Set Up Network Access

1. In the left sidebar, click "Network Access" under "Security"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development purposes)
4. Click "Confirm"

## 5. Get Your Connection String

1. In the left sidebar, click "Database" under "Deployment"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string

## 6. Update Your .env File

1. Open the `.env` file in the `backend` directory
2. Replace the `MONGODB_URI` value with your connection string
3. Replace `<username>` and `<password>` with your database user credentials
4. Replace `<dbname>` with `job-application-saas`

Example:
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/job-application-saas?retryWrites=true&w=majority
```

## 7. Start Your Application

Now you can start your application with:

```
npm run dev
```

Your application will connect to MongoDB Atlas instead of a local MongoDB instance.
