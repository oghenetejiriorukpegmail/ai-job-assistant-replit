/**
 * User model functionality
 * 
 * This file provides user-specific functionality that works across our
 * supported database backends.
 */

const bcrypt = require('bcrypt');
const { User } = require('./index');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user document
 */
async function createUser(userData) {
  // Hash password
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  // Add default role if not provided
  if (!userData.role) {
    userData.role = 'user';
  }
  
  return User.insertOne(userData);
}

/**
 * Find a user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User document or null
 */
async function findUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Find a user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} - User document or null
 */
async function findUserById(id) {
  return User.findById(id);
}

/**
 * Verify password against hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Update user information
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} - Updated user document or null
 */
async function updateUser(id, updateData) {
  // Hash password if provided
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }
  
  return User.findByIdAndUpdate(id, { $set: updateData });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  updateUser
};
