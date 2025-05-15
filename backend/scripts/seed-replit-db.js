/**
 * Script to seed the Replit Database with initial data,
 * specifically creating a default admin user.
 *
 * Run with: node backend/scripts/seed-replit-db.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { connectDB, getCollection, isUsingReplitDB } = require('../src/config/database');
const { createUser, findUserByEmail } = require('../src/models/User'); // Assuming User model functions are exported

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function seedDatabase() {
  console.log('Attempting to connect to the database...');
  await connectDB();

  if (!isUsingReplitDB()) {
    console.warn(
      'This script is intended for Replit Database seeding, but Replit DB is not the active adapter.'
    );
    // Optionally, you could allow it to proceed or exit
    // For now, let's allow it to proceed to see if it works with other adapters if configured.
  }

  console.log(`Checking for existing admin user: ${ADMIN_EMAIL}`);
  const existingAdmin = await findUserByEmail(ADMIN_EMAIL);

  if (existingAdmin) {
    console.log(`Admin user ${ADMIN_EMAIL} already exists. Seeding not required for this user.`);
  } else {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);
    try {
      const adminData = {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: 'Default Admin',
        roles: ['user', 'admin'], // Explicitly set roles
      };
      const newUser = await createUser(adminData); // createUser should handle hashing and default role
      
      // Ensure the 'admin' role is definitely set if createUser doesn't handle 'roles' array directly
      if (!newUser.roles || !newUser.roles.includes('admin')) {
        const UserCollection = getCollection('users');
        await UserCollection.findByIdAndUpdate(newUser._id, { $set: { roles: ['user', 'admin'] } });
        console.log(`Admin user ${newUser.email} created and roles updated successfully.`);
      } else {
        console.log(`Admin user ${newUser.email} created successfully.`);
      }

    } catch (error) {
      console.error('Error creating admin user:', error);
      process.exit(1);
    }
  }

  // Add other seeding logic here if needed (e.g., default settings)

  console.log('Database seeding process complete.');
  process.exit(0);
}

seedDatabase().catch((error) => {
  console.error('Unhandled error during database seeding:', error);
  process.exit(1);
});