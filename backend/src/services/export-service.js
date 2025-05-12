/**
 * Export Service
 * 
 * This service handles exporting data in various formats.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const logger = require('../utils/logger');

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Array of field definitions { key, label }
 * @returns {string} - CSV content
 */
function exportToCsv(data, fields) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // Create header row
  const header = fields.map(field => `"${field.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return fields.map(field => {
      const value = item[field.key];
      
      // Handle different types of values
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'string') {
        // Escape quotes in strings
        return `"${value.replace(/"/g, '""')}"`;
      } else if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      } else if (typeof value === 'object') {
        // Convert objects to JSON strings
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        return `"${value}"`;
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [header, ...rows].join('\n');
}

/**
 * Export data to JSON format
 * @param {Array|Object} data - Data to export
 * @returns {string} - JSON content
 */
function exportToJson(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Export data to XML format
 * @param {Array} data - Array of objects to export
 * @param {string} rootElement - Name of the root element
 * @param {string} itemElement - Name of the item element
 * @returns {string} - XML content
 */
function exportToXml(data, rootElement = 'data', itemElement = 'item') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}></${rootElement}>`;
  }
  
  // Create XML header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;
  
  // Add items
  data.forEach(item => {
    xml += `  <${itemElement}>\n`;
    
    // Add properties
    Object.entries(item).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        xml += `    <${key}/>\n`;
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        // Handle nested objects
        xml += `    <${key}>${JSON.stringify(value)}</${key}>\n`;
      } else {
        // Escape special characters
        const escapedValue = String(value instanceof Date ? value.toISOString() : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        
        xml += `    <${key}>${escapedValue}</${key}>\n`;
      }
    });
    
    xml += `  </${itemElement}>\n`;
  });
  
  // Close root element
  xml += `</${rootElement}>`;
  
  return xml;
}

/**
 * Save export file to disk
 * @param {string} content - File content
 * @param {string} format - File format (csv, json, xml)
 * @param {string} filename - Base filename
 * @returns {Promise<string>} - Full file path
 */
async function saveExportFile(content, format, filename) {
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}_${timestamp}.${format}`;
    const filePath = path.join(exportsDir, fullFilename);
    
    // Write file
    await writeFileAsync(filePath, content, 'utf8');
    
    logger.info(`Export file saved: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('Error saving export file:', error);
    throw error;
  }
}

/**
 * Export crawl results
 * @param {Array} crawlResults - Crawl results to export
 * @param {string} format - Export format (csv, json, xml)
 * @returns {Promise<string>} - Export content
 */
async function exportCrawlResults(crawlResults, format = 'csv') {
  try {
    let content = '';
    
    // Define fields for CSV export
    const fields = [
      { key: 'jobId', label: 'Crawl ID' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
      { key: 'duration', label: 'Duration (ms)' },
      { key: 'result.total', label: 'Total Jobs' },
      { key: 'result.saved', label: 'Saved Jobs' },
      { key: 'result.duplicates', label: 'Duplicates' },
      { key: 'result.errors', label: 'Errors' }
    ];
    
    // Process nested fields
    const processedData = crawlResults.map(result => {
      const processed = { ...result };
      
      // Handle nested fields
      if (result.result) {
        processed['result.total'] = result.result.total;
        processed['result.saved'] = result.result.saved;
        processed['result.duplicates'] = result.result.duplicates;
        processed['result.errors'] = result.result.errors;
      }
      
      return processed;
    });
    
    // Generate content based on format
    switch (format.toLowerCase()) {
      case 'csv':
        content = exportToCsv(processedData, fields);
        break;
      case 'json':
        content = exportToJson(crawlResults);
        break;
      case 'xml':
        content = exportToXml(crawlResults, 'crawlResults', 'crawl');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    // Save file
    const filePath = await saveExportFile(content, format, 'crawl_results');
    
    return {
      filePath,
      filename: path.basename(filePath),
      format,
      size: content.length,
      content
    };
  } catch (error) {
    logger.error('Error exporting crawl results:', error);
    throw error;
  }
}

/**
 * Export crawl statistics
 * @param {Object} stats - Crawl statistics to export
 * @param {string} format - Export format (csv, json, xml)
 * @returns {Promise<string>} - Export content
 */
async function exportCrawlStats(stats, format = 'csv') {
  try {
    let content = '';
    
    // Define fields for CSV export
    const fields = [
      { key: '_id', label: 'Source' },
      { key: 'totalJobs', label: 'Total Jobs' },
      { key: 'savedJobs', label: 'Saved Jobs' },
      { key: 'duplicateJobs', label: 'Duplicates' },
      { key: 'errorJobs', label: 'Errors' },
      { key: 'avgDuration', label: 'Avg Duration (ms)' },
      { key: 'count', label: 'Crawl Count' }
    ];
    
    // Generate content based on format
    switch (format.toLowerCase()) {
      case 'csv':
        content = exportToCsv(stats.bySource, fields);
        break;
      case 'json':
        content = exportToJson(stats);
        break;
      case 'xml':
        content = exportToXml(stats.bySource, 'crawlStats', 'source');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    // Save file
    const filePath = await saveExportFile(content, format, 'crawl_stats');
    
    return {
      filePath,
      filename: path.basename(filePath),
      format,
      size: content.length,
      content
    };
  } catch (error) {
    logger.error('Error exporting crawl statistics:', error);
    throw error;
  }
}

/**
 * Export jobs data
 * @param {Array} jobs - Jobs data to export
 * @param {string} format - Export format (csv, json, xml)
 * @returns {Promise<string>} - Export content
 */
async function exportJobs(jobs, format = 'csv') {
  try {
    let content = '';
    
    // Define fields for CSV export
    const fields = [
      { key: 'title', label: 'Title' },
      { key: 'company', label: 'Company' },
      { key: 'location', label: 'Location' },
      { key: 'description', label: 'Description' },
      { key: 'url', label: 'URL' },
      { key: 'salary', label: 'Salary' },
      { key: 'source', label: 'Source' },
      { key: 'postedDate', label: 'Posted Date' },
      { key: 'remote', label: 'Remote' },
      { key: 'jobType', label: 'Job Type' }
    ];
    
    // Generate content based on format
    switch (format.toLowerCase()) {
      case 'csv':
        content = exportToCsv(jobs, fields);
        break;
      case 'json':
        content = exportToJson(jobs);
        break;
      case 'xml':
        content = exportToXml(jobs, 'jobs', 'job');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    // Save file
    const filePath = await saveExportFile(content, format, 'jobs');
    
    return {
      filePath,
      filename: path.basename(filePath),
      format,
      size: content.length,
      content
    };
  } catch (error) {
    logger.error('Error exporting jobs data:', error);
    throw error;
  }
}

module.exports = {
  exportToCsv,
  exportToJson,
  exportToXml,
  saveExportFile,
  exportCrawlResults,
  exportCrawlStats,
  exportJobs
};
