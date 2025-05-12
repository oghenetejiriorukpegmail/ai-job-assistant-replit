// frontend/src/components/ExportDataForm.jsx

/**
 * Export Data Form component.
 * Allows users to export data in various formats.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import { apiRequest } from '../api';
import '../styles/export-data-form.css';

function ExportDataForm() {
  const [exportType, setExportType] = useState('crawlResults');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportResult, setExportResult] = useState(null);
  
  const handleExport = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setExportResult(null);
    
    try {
      let endpoint = '';
      
      // Determine endpoint based on export type
      switch (exportType) {
        case 'crawlResults':
          endpoint = `/api/jobs/export/crawls?format=${exportFormat}`;
          break;
        case 'crawlStats':
          endpoint = `/api/jobs/export/stats?format=${exportFormat}`;
          break;
        case 'jobs':
          endpoint = `/api/jobs/export/jobs?format=${exportFormat}`;
          break;
        default:
          throw new Error('Invalid export type');
      }
      
      // Make API request
      const result = await apiRequest(endpoint);
      setExportResult(result);
    } catch (err) {
      setError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadExport = () => {
    if (!exportResult) return;
    
    // Create a blob from the content
    const blob = new Blob([exportResult.content], { 
      type: getContentType(exportFormat) 
    });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  const getContentType = (format) => {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'xml':
        return 'application/xml';
      default:
        return 'text/plain';
    }
  };
  
  return (
    <div className="export-data-form">
      <h3>Export Data</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleExport}>
        <div className="form-group">
          <label htmlFor="exportType">Export Type</label>
          <select
            id="exportType"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            required
          >
            <option value="crawlResults">Crawl Results</option>
            <option value="crawlStats">Crawl Statistics</option>
            <option value="jobs">Jobs Data</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="exportFormat">Format</label>
          <select
            id="exportFormat"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            required
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Exporting...' : 'Generate Export'}
        </button>
      </form>
      
      {exportResult && (
        <div className="export-result">
          <h4>Export Ready</h4>
          <p>
            <strong>Filename:</strong> {exportResult.filename}
          </p>
          <p>
            <strong>Format:</strong> {exportResult.format.toUpperCase()}
          </p>
          <p>
            <strong>Size:</strong> {Math.round(exportResult.size / 1024)} KB
          </p>
          <button 
            onClick={downloadExport}
            className="btn-download"
          >
            Download File
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportDataForm;
