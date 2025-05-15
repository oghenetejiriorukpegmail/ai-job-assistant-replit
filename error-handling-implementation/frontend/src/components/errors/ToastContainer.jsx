import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ToastNotification from './ToastNotification';

/**
 * Toast Container Component
 * 
 * This component manages multiple toast notifications and provides
 * a global API for showing toasts from anywhere in the application.
 */
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Add event listener for custom toast events
  useEffect(() => {
    // Handler for toast events
    const handleToastEvent = (event) => {
      const { message, type, duration } = event.detail;
      
      // Generate a unique ID for this toast
      const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Add the new toast to the list
      setToasts(prevToasts => [
        ...prevToasts,
        { id, message, type, duration }
      ]);
    };

    // Listen for custom toast events
    window.addEventListener('show-toast', handleToastEvent);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};

// Global functions to show different types of toasts
export const showToast = (message, type = 'info', duration = 5000) => {
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { message, type, duration }
  }));
};

export const showErrorToast = (message, duration = 5000) => {
  showToast(message, 'error', duration);
};

export const showWarningToast = (message, duration = 5000) => {
  showToast(message, 'warning', duration);
};

export const showSuccessToast = (message, duration = 5000) => {
  showToast(message, 'success', duration);
};

export const showInfoToast = (message, duration = 5000) => {
  showToast(message, 'info', duration);
};

export default ToastContainer;