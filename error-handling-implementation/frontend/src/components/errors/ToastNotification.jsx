import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Toast Notification Component
 * 
 * This component displays toast notifications for errors, warnings, and success messages.
 * It automatically dismisses after a specified duration.
 */
const ToastNotification = ({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Set a timer to automatically dismiss the toast
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    // Clear the timer on component unmount
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // If not visible, don't render
  if (!visible) {
    return null;
  }

  // Determine toast class based on type
  const toastClass = `toast toast-${type}`;

  return (
    <div className={toastClass} role="alert">
      <div className="toast-content">
        {type === 'error' && <span className="toast-icon">⚠️</span>}
        {type === 'warning' && <span className="toast-icon">⚠️</span>}
        {type === 'success' && <span className="toast-icon">✅</span>}
        {type === 'info' && <span className="toast-icon">ℹ️</span>}
        
        <div className="toast-message">{message}</div>
        
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

ToastNotification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'warning', 'success', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func
};

export default ToastNotification;