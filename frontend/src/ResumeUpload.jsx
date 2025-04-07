// frontend/src/ResumeUpload.jsx

/**
 * Resume upload component.
 * Allows user to upload PDF/DOCX resume.
 * 
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import { apiRequest } from './api';

const API_BASE_URL = 'http://localhost:5000';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.jwtToken}`,
        },
        body: formData,
      });
      setMessage('Resume uploaded successfully.');
    } catch (err) {
      setError('Upload failed.');
    }
  };

  return (
    <div>
      <h3>Upload Resume</h3>
      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} /><br/>
      <button onClick={handleUpload}>Upload</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ResumeUpload;