/**
 * Error Classes Index
 * 
 * This module exports all custom error classes for easy importing.
 */

const AppError = require('./AppError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');
const NotFoundError = require('./NotFoundError');
const ExternalServiceError = require('./ExternalServiceError');
const DatabaseError = require('./DatabaseError');

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ExternalServiceError,
  DatabaseError
};