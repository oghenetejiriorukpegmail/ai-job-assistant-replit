// frontend/src/App.jsx

/**
 * Main frontend app component.
 * Handles authentication flow and dashboard placeholder.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import Auth from './Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Welcome to Job Application SaaS</h1>
          <p>Dashboard and features coming soon.</p>
        </div>
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
