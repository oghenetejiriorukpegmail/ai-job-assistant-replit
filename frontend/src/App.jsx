// frontend/src/App.jsx

/**
 * Main frontend app component.
 * Handles authentication flow and profile/dashboard.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import Auth from './Auth';
import Profile from './Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div>
      {isAuthenticated ? (
        <Profile />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
