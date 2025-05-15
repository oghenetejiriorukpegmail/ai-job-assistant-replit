// frontend/src/ResumeUpload.jsx

/**
 * Resume upload component.
 * Allows user to upload PDF/DOCX resume.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState, useEffect } from 'react';
import { saveResumeData } from './services/storage-service';
import FileInput from './components/FileInput';
import ParsedResume from './components/ParsedResume';

const API_BASE_URL = 'http://localhost:5000';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedResume, setParsedResume] = useState(null);
  const [provider, setProvider] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  useEffect(() => {
    // AI parsing is always enabled
    localStorage.setItem('enableAIParsing', 'true');
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setMessage('');
      // Error handling is now done in the FileInput component
    }
  };
  
  const handleFileError = (errorMessage) => {
    setError(errorMessage);
    setFile(null);
    setFileName('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    setFallbackUsed(false);

    const formData = new FormData();
    formData.append('resume', file);

    // Get the AI provider from settings
    const aiProvider = localStorage.getItem('aiProvider') || 'openrouter';
    formData.append('provider', aiProvider);

    // Get the model for the provider
    let model;
    switch(aiProvider) {
      case 'google':
      case 'gemini-2.0-flash':
        model = localStorage.getItem('geminiModel') || 'gemini-2.5-pro-exp-03-25';
        break;
      case 'openai':
        model = localStorage.getItem('openaiModel') || 'gpt-3.5-turbo';
        break;
      case 'openrouter':
        model = localStorage.getItem('openrouterModel') || 'openrouter/quasar-alpha';
        break;
      case 'anthropic':
        model = localStorage.getItem('anthropicModel') || 'claude-3-opus-20240229';
        break;
      case 'mistral':
        model = localStorage.getItem('mistralModel') || 'mistral-large-latest';
        break;
      default:
        model = localStorage.getItem('aiModel') || 'openrouter/quasar-alpha';
    }
    
    if (model) {
      formData.append('model', model);
    }

    try {
      // We need to use fetch directly for FormData uploads
      const headers = {};

      // Get the JWT token from localStorage
      const token = localStorage.getItem('jwtToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('Authentication token missing. Please log in again.');
      }

      // Get the API key for the provider
      let apiKey;
      switch(aiProvider) {
        case 'google':
        case 'gemini-2.0-flash':
          apiKey = localStorage.getItem('geminiApiKey');
          break;
        case 'openai':
          apiKey = localStorage.getItem('openaiApiKey');
          break;
        case 'openrouter':
          apiKey = localStorage.getItem('openrouterApiKey');
          break;
        case 'anthropic':
          apiKey = localStorage.getItem('anthropicApiKey');
          break;
        case 'mistral':
          apiKey = localStorage.getItem('mistralApiKey');
          break;
        default:
          apiKey = localStorage.getItem('openrouterApiKey');
      }
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      // Create a controller for request cancellation (timeout)
      const controller = new AbortController();
      
      // Set a longer timeout for AI processing (45 seconds)
      const timeoutId = setTimeout(() => {
        setUploadStatus('Request is taking longer than expected. Still waiting...');
        
        // After another 15 seconds, abort the request
        setTimeout(() => {
          setUploadStatus('Request timed out. Aborting...');
          controller.abort();
        }, 15000);
      }, 30000);

      // Use the AI endpoint for resume parsing with the provider and model from settings
      const modelParam = model ? `&model=${model}` : '';
      
      setUploadStatus('Uploading file...');
      setUploadProgress(10);
      
      // Implement retry mechanism
      let retryCount = 0;
      const maxRetries = 2;
      let response;
      
      while (retryCount <= maxRetries) {
        try {
          setUploadStatus(retryCount > 0 ? `Retry attempt ${retryCount}...` : 'Processing with AI...');
          setUploadProgress(retryCount === 0 ? 30 : 30 + (retryCount * 10));
          
          response = await fetch(`${API_BASE_URL}/api/resumes/upload/ai?provider=${aiProvider}${modelParam}`, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal
          });
          
          // If we got a response, break out of the retry loop
          break;
        } catch (fetchError) {
          // Don't retry if it's an abort error (timeout)
          if (fetchError.name === 'AbortError') {
            throw fetchError;
          }
          
          // Don't retry if we've reached the max retries
          if (retryCount >= maxRetries) {
            throw fetchError;
          }
          
          // Retry with exponential backoff
          retryCount++;
          setUploadStatus(`Network error. Retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      setUploadProgress(70);
      setUploadStatus('Processing response...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Resume parsing failed. Please check your AI settings and try again.');
      }

      setUploadProgress(90);
      const data = await response.json();
      setUploadProgress(100);
      setUploadStatus('Complete!');
      setMessage('Resume uploaded and analyzed successfully.');

      // Check if fallback parser was used
      if (data.provider && data.provider.includes('Fallback')) {
        setFallbackUsed(true);
      }

      // Store the parsed resume data
      if (data && data.structured) {
        setParsedResume(data.structured);
        setProvider(data.provider || 'AI');

        // Save to local storage for persistence
        saveResumeData({
          structured: data.structured,
          provider: data.provider || 'AI',
          timestamp: new Date().toISOString(),
          fallback: data.provider && data.provider.includes('Fallback')
        });
      }
    } catch (err) {
      setUploadProgress(0);
      
      if (err.name === 'AbortError') {
        setError('Upload timed out after 45 seconds. The AI service might be experiencing high load. Please try again later.');
      } else if (err.message.includes('NetworkError') || err.message.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message.includes('API key') || err.message.includes('Authentication')) {
        setError('Authentication error. Please check your API key in Settings.');
      } else {
        setError(err.message || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="resume-upload-container">
      <h3>Upload Resume</h3>
      <p className="upload-instructions">Upload your resume in PDF or DOCX format (max 5MB)</p>
      <p className="ai-note">Your resume will be analyzed using the AI provider configured in Settings</p>

      <FileInput
        onFileChange={handleFileChange}
        fileName={fileName}
        disabled={isUploading}
        onError={handleFileError}
      />

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`upload-button ${isUploading ? 'uploading' : ''}`}
      >
        {isUploading ? 'Processing...' : 'Upload Resume'}
      </button>

      {isUploading && (
        <div className="upload-progress-container">
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="upload-status">{uploadStatus}</p>
        </div>
      )}

      {message && <p className="success-message">{message}</p>}
      {fallbackUsed && (
        <p className="fallback-message">
          <span className="fallback-icon">⚠️</span>
          AI analysis was unavailable. Basic parsing was used as a fallback.
        </p>
      )}
      {error && <p className="error-message">{error}</p>}

      <ParsedResume parsedResume={parsedResume} provider={provider} />
    </div>
  );
}

export default ResumeUpload;