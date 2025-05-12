import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './styles/theme-toggle.css'
import './styles/auth.css'
import './styles/resume-upload.css'
import './styles/preferences-wizard.css'
import './styles/job-crawler-dashboard.css'
import './styles/job-crawler-analytics.css'
import './styles/advanced-schedule-form.css'
import './styles/export-data-form.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
