# Robust Error Handling Implementation

This directory contains the implementation of a robust error handling system for the recruitment platform as outlined in the ERROR_HANDLING_IMPLEMENTATION_PLAN.md document.

## Overview

The implementation includes:

1. **Custom Error Classes**: A set of standardized error classes for different error types
2. **Global Error Handler**: A middleware that catches and formats all errors
3. **Request ID Tracking**: Middleware to track requests across the system
4. **Enhanced Logging**: A structured logger with request context
5. **Retry Logic**: Utilities for retrying operations that may fail due to transient errors
6. **Circuit Breaker**: Implementation of the circuit breaker pattern for external service calls
7. **Frontend Error Handling**: Enhanced error boundary components and toast notifications
8. **Improved API Client**: A robust API client with error handling and retry logic

## Backend Components

### Custom Error Classes

Located in `backend/src/utils/errors/`, these classes provide a standardized way to create and handle errors:

- `AppError`: Base application error class
- `ValidationError`: For input validation errors
- `AuthenticationError`: For authentication failures
- `AuthorizationError`: For permission issues
- `NotFoundError`: For resource not found errors
- `ExternalServiceError`: For external service failures
- `DatabaseError`: For database operation failures

Example usage:

```javascript
const { ValidationError } = require('../utils/errors');

function validateUser(user) {
  if (!user.email) {
    throw new ValidationError('Email is required', { field: 'email' });
  }
}
```

### Global Error Handler

Located in `backend/src/middleware/error-handler.middleware.js`, this middleware catches all errors and formats them into a consistent response format.

To use it, add it as the last middleware in your Express app:

```javascript
const errorHandlerMiddleware = require('./middleware/error-handler.middleware');

// Add all your routes here

// Add error handler as the last middleware
app.use(errorHandlerMiddleware);
```

### Request ID Middleware

Located in `backend/src/middleware/request-id.middleware.js`, this middleware generates a unique ID for each request and adds it to the request object and response headers.

To use it, add it as one of the first middlewares in your Express app:

```javascript
const requestIdMiddleware = require('./middleware/request-id.middleware');

// Add request ID middleware early in the middleware chain
app.use(requestIdMiddleware);
```

### Request Logger Middleware

Located in `backend/src/middleware/request-logger.middleware.js`, this middleware logs details about incoming requests and outgoing responses.

To use it, add it after the request ID middleware:

```javascript
const requestLoggerMiddleware = require('./middleware/request-logger.middleware');

// Add request logger middleware after request ID middleware
app.use(requestLoggerMiddleware);
```

### Enhanced Logger

Located in `backend/src/utils/logger.js`, this module provides structured logging with request context.

Example usage:

```javascript
const logger = require('../utils/logger');

function processOrder(order) {
  logger.info('Processing order', { orderId: order.id });
  
  try {
    // Process order
    logger.info('Order processed successfully', { orderId: order.id });
  } catch (error) {
    logger.error('Failed to process order', error);
    throw error;
  }
}
```

### Async Handler

Located in `backend/src/utils/async-handler.js`, this utility wraps async controller methods to catch errors.

Example usage:

```javascript
const asyncHandler = require('../utils/async-handler');

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
});
```

### Circuit Breaker

Located in `backend/src/utils/circuit-breaker.js`, this module implements the circuit breaker pattern for external service calls.

Example usage:

```javascript
const { CircuitBreaker } = require('../utils/circuit-breaker');

// Create a circuit breaker for the payment service
const paymentServiceBreaker = new CircuitBreaker('payment-service', {
  failureThreshold: 3,
  resetTimeout: 10000
});

async function processPayment(paymentData) {
  return paymentServiceBreaker.execute(
    async () => {
      // Call payment service
      return await paymentService.processPayment(paymentData);
    },
    'processPayment'
  );
}
```

### Retry Utility

Located in `backend/src/utils/retry.js`, this module provides utilities for retrying operations that may fail due to transient errors.

Example usage:

```javascript
const { retry, makeRetryable } = require('../utils/retry');

// Retry a function
async function fetchExternalData() {
  return retry(
    async () => {
      return await externalService.getData();
    },
    {
      maxRetries: 3,
      operationName: 'fetchExternalData'
    }
  );
}

// Make a function retryable
const retryableFetchData = makeRetryable(externalService.getData, {
  maxRetries: 3,
  operationName: 'fetchData'
});
```

## Frontend Components

### Error Boundary

Located in `frontend/src/components/errors/ErrorBoundary.jsx`, this component catches JavaScript errors in its child component tree and displays a fallback UI.

Example usage:

```jsx
import ErrorBoundary from './components/errors/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Toast Notifications

Located in `frontend/src/components/errors/ToastContainer.jsx` and `ToastNotification.jsx`, these components display toast notifications for errors, warnings, and success messages.

Example usage:

```jsx
import { showErrorToast, showSuccessToast } from './components/errors/ToastContainer';

function handleSubmit() {
  try {
    // Submit form
    showSuccessToast('Form submitted successfully');
  } catch (error) {
    showErrorToast('Failed to submit form');
  }
}
```

### Enhanced API Client

Located in `frontend/src/utils/api.js`, this module provides a robust API client with error handling and retry logic.

Example usage:

```jsx
import { get, post } from './utils/api';

async function fetchUserProfile(userId) {
  return get(`/api/users/${userId}`);
}

async function updateUserProfile(userId, data) {
  return post(`/api/users/${userId}`, data);
}
```

## Integration

To integrate these components into the existing application:

1. Copy the backend components to the corresponding directories in the backend
2. Copy the frontend components to the corresponding directories in the frontend
3. Update the main Express app to use the new middleware
4. Update the frontend to use the new error boundary and toast notifications
5. Replace the existing API client with the enhanced version

## Testing

To test the error handling system:

1. Test custom error classes by throwing different types of errors
2. Test the global error handler by triggering errors in different parts of the application
3. Test the request ID tracking by checking the response headers and logs
4. Test the retry logic by simulating transient errors
5. Test the circuit breaker by simulating service failures
6. Test the frontend error boundary by triggering errors in components
7. Test the toast notifications by showing different types of notifications
8. Test the API client by simulating different error scenarios

## Conclusion

This implementation provides a comprehensive error handling system that improves the reliability and user experience of the recruitment platform. By standardizing error handling across the application, we can provide better feedback to users and make troubleshooting easier for developers.