// backend/src/resumes/utils/file-utils.js

const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

// Supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  'pdf': ['application/pdf'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'doc': ['application/msword']
};

// Flatten the MIME types array for easy checking
const SUPPORTED_MIME_TYPES = Object.values(SUPPORTED_FILE_TYPES).flat();

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Check if the file type is supported
    if (SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Please upload one of the following: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}.`));
    }
  },
});

/**
 * Extract text from a PDF file
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(buffer) {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF file.');
    }
    
    // Check for PDF header signature
    const pdfSignature = buffer.slice(0, 5).toString('ascii');
    if (!pdfSignature.startsWith('%PDF-')) {
      throw new Error('Invalid PDF file format. File does not have a valid PDF signature.');
    }
    
    const data = await pdfParse(buffer, {
      // Add options to handle problematic PDFs
      max: 50, // Maximum pages to parse (prevent huge files from causing issues)
      pagerender: function(pageData) {
        return pageData.getTextContent()
          .then(function(textContent) {
            let text = '';
            textContent.items.forEach(function(item) {
              text += item.str + ' ';
            });
            return text;
          });
      }
    });
    
    return data.text || 'No text content found in PDF.';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    if (error.message.includes('Invalid PDF')) {
      throw new Error('Invalid or corrupted PDF file. Please check the file and try again.');
    }
    throw new Error(`Failed to parse PDF file: ${error.message}`);
  }
}

/**
 * Extract text from a DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDOCX(buffer) {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid DOCX file.');
    }
    
    // Check for DOCX file signature (ZIP format)
    const zipSignature = buffer.slice(0, 4).toString('hex');
    if (zipSignature !== '504b0304') { // PK\x03\x04 signature for ZIP files
      throw new Error('Invalid DOCX file format. File does not have a valid DOCX/ZIP signature.');
    }
    
    const result = await mammoth.extractRawText({
      buffer,
      convertImage: mammoth.images.imgElement(function(image) {
        return { src: image.src };
      })
    });
    
    // Check if we got any content
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in the DOCX file.');
    }
    
    // Log any warnings for debugging
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    if (error.message.includes('Invalid DOCX')) {
      throw new Error('Invalid or corrupted DOCX file. Please check the file and try again.');
    }
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
}

/**
 * Validate file before processing
 * @param {Object} file - File object from multer
 * @returns {Object} - Validation result with status and message
 */
function validateFile(file) {
  if (!file) {
    return { valid: false, message: 'No file provided.' };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB.`
    };
  }
  
  // Check file type
  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      message: `Unsupported file type. Please upload one of the following: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}.`
    };
  }
  
  // Get file extension
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  // Check if extension matches mimetype
  const validExtensionsForMime = Object.entries(SUPPORTED_FILE_TYPES)
    .filter(([_, mimeTypes]) => mimeTypes.includes(file.mimetype))
    .map(([ext, _]) => ext);
  
  if (!validExtensionsForMime.includes(fileExtension)) {
    return {
      valid: false,
      message: `File extension does not match the file content. Expected ${validExtensionsForMime.join(' or ')}, got ${fileExtension}.`
    };
  }
  
  return { valid: true };
}

module.exports = {
  upload,
  extractTextFromPDF,
  extractTextFromDOCX,
  validateFile,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE
};
