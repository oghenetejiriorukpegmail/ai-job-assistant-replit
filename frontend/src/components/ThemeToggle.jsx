import React from 'react';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <i className="fas fa-moon"></i>
      ) : (
        <i className="fas fa-sun"></i>
      )}
      
      <style jsx>{`
        .theme-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          color: var(--text-color);
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s, transform 0.3s;
          width: 40px;
          height: 40px;
        }
        
        .theme-toggle:hover {
          background-color: var(--hover-color);
          transform: scale(1.1);
        }
        
        .theme-toggle:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
      `}</style>
    </button>
  );
}

export default ThemeToggle;
