import React, { useState } from 'react';

// Supported file types
const SUPPORTED_FILE_TYPES = {
  'pdf': ['application/pdf'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function FileInput({ onFileChange, fileName, disabled, onError }) {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const validateFile = (file) => {
    // Check if file exists
    if (!file) {
      return { valid: false, message: 'No file selected.' };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `File size exceeds the maximum limit of ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB.`
      };
    }
    
    // Check file type
    const acceptedMimeTypes = Object.values(SUPPORTED_FILE_TYPES).flat();
    if (!acceptedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        message: `Unsupported file type. Please upload one of the following: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}.`
      };
    }
    
    return { valid: true };
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const validationResult = validateFile(file);
      
      if (!validationResult.valid) {
        if (onError) {
          onError(validationResult.message);
        }
        // Reset the file input
        e.target.value = '';
        return;
      }
      
      // Clear any previous errors
      if (onError) {
        onError('');
      }
      
      // Pass the valid file to the parent component
      onFileChange(e);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationResult = validateFile(file);
      
      if (!validationResult.valid) {
        if (onError) {
          onError(validationResult.message);
        }
        return;
      }
      
      // Clear any previous errors
      if (onError) {
        onError('');
      }
      
      // Create a synthetic event to pass to onFileChange
      const syntheticEvent = {
        target: {
          files: [file]
        }
      };
      
      onFileChange(syntheticEvent);
    }
  };
  
  return (
    <div
      className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <label className="file-upload-label">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="file-input"
          disabled={disabled}
        />
        <div className="upload-button-area">
          <span className="upload-icon">📄</span>
          <span>{fileName || 'Choose file or drag and drop'}</span>
        </div>
      </label>
      <div className="file-types-info">
        <p>Supported formats: PDF, DOCX (max {MAX_FILE_SIZE / (1024 * 1024)}MB)</p>
      </div>
    </div>
  );
}

export default FileInput;