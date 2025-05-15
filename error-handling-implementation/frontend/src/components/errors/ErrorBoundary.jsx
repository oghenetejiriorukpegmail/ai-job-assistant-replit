import React from 'react';
import PropTypes from 'prop-types';
import ErrorFallback from './ErrorFallback';

/**
 * Enhanced Error Boundary Component
 * 
 * This component catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * It also provides options for error reporting and recovery.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Generate a unique error ID for tracking
    const errorId = this.generateErrorId();
    
    // Update state with error details
    this.setState({ errorInfo, errorId });
    
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Report the error to monitoring service if enabled
    this.reportError(error, errorInfo, errorId);
  }

  /**
   * Generate a unique error ID for tracking
   * @returns {string} - Unique error ID
   */
  generateErrorId() {
    return `err-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  /**
   * Report error to monitoring service
   * @param {Error} error - Error object
   * @param {Object} errorInfo - React error info
   * @param {string} errorId - Unique error ID
   */
  reportError(error, errorInfo, errorId) {
    if (this.props.onError) {
      this.props.onError({
        error,
        errorInfo,
        errorId,
        componentName: this.props.name || 'Unknown Component'
      });
    }
    
    // Here you would typically send the error to your monitoring service
    // Example: sendToErrorMonitoring(error, errorInfo, errorId);
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      // Use custom fallback if provided, otherwise use default ErrorFallback
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          errorId,
          resetErrorBoundary: this.resetErrorBoundary
        });
      }
      
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  name: PropTypes.string
};

export default ErrorBoundary;