import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error Fallback Component
 * 
 * This component displays a user-friendly error message when an error occurs.
 * It provides options to retry or report the error.
 */
const ErrorFallback = ({ error, errorInfo, errorId, resetErrorBoundary }) => {
  return (
    <div className="error-fallback">
      <div className="error-container">
        <h2>Something went wrong</h2>
        
        <div className="error-message">
          <p>We're sorry, but an unexpected error occurred.</p>
          {errorId && (
            <p className="error-id">
              Error ID: <code>{errorId}</code>
            </p>
          )}
        </div>
        
        <div className="error-actions">
          <button 
            onClick={resetErrorBoundary}
            className="retry-button"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>
        
        {process.env.NODE_ENV !== 'production' && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error && error.toString()}</pre>
            <pre>{errorInfo && errorInfo.componentStack}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  errorId: PropTypes.string,
  resetErrorBoundary: PropTypes.func.isRequired
};

export default ErrorFallback;