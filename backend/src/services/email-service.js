/**
 * Email Service
 * 
 * This service handles sending emails for various application events.
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || 'user@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Job Application SaaS <noreply@example.com>';

// Create transporter
let transporter;

/**
 * Initialize the email service
 * @returns {boolean} - True if initialized successfully
 */
function initialize() {
  try {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    
    logger.info('Email service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize email service:', error);
    return false;
  }
}

/**
 * Check if email service is configured
 * @returns {boolean} - True if configured
 */
function isConfigured() {
  return !!(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS);
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<boolean>} - True if sent successfully
 */
async function sendEmail(options) {
  if (!isConfigured()) {
    logger.warn('Email service not configured. Email not sent.');
    return false;
  }
  
  if (!transporter) {
    initialize();
  }
  
  try {
    const { to, subject, text, html } = options;
    
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html: html || text
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send a crawl completion notification
 * @param {Object} user - User object
 * @param {Object} crawlJob - Crawl job object
 * @returns {Promise<boolean>} - True if sent successfully
 */
async function sendCrawlCompletionNotification(user, crawlJob) {
  if (!user || !user.email || !crawlJob) {
    logger.warn('Missing user or crawl job data. Email not sent.');
    return false;
  }
  
  const subject = `Job Crawl ${crawlJob.status === 'completed' ? 'Completed' : 'Failed'}: ${crawlJob.source}`;
  
  let text = `Hello ${user.firstName || user.email},\n\n`;
  text += `Your job crawl for ${crawlJob.source} has ${crawlJob.status}.\n\n`;
  
  if (crawlJob.status === 'completed' && crawlJob.result) {
    text += `Results:\n`;
    text += `- Total jobs found: ${crawlJob.result.total}\n`;
    text += `- Jobs saved: ${crawlJob.result.saved}\n`;
    text += `- Duplicates: ${crawlJob.result.duplicates}\n`;
    text += `- Errors: ${crawlJob.result.errors}\n\n`;
  } else if (crawlJob.status === 'failed' && crawlJob.error) {
    text += `Error: ${crawlJob.error.message}\n\n`;
  }
  
  text += `Duration: ${formatDuration(crawlJob.duration)}\n\n`;
  text += `You can view the full results in your dashboard.\n\n`;
  text += `Best regards,\nJob Application SaaS Team`;
  
  // HTML version
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6ee0;">Job Crawl ${crawlJob.status === 'completed' ? 'Completed' : 'Failed'}</h2>
      <p>Hello ${user.firstName || user.email},</p>
      <p>Your job crawl for <strong>${crawlJob.source}</strong> has ${crawlJob.status}.</p>
  `;
  
  if (crawlJob.status === 'completed' && crawlJob.result) {
    html += `
      <h3>Results:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Metric</th>
          <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Count</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Total jobs found</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${crawlJob.result.total}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Jobs saved</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${crawlJob.result.saved}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Duplicates</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${crawlJob.result.duplicates}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Errors</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${crawlJob.result.errors}</td>
        </tr>
      </table>
    `;
  } else if (crawlJob.status === 'failed' && crawlJob.error) {
    html += `
      <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <strong>Error:</strong> ${crawlJob.error.message}
      </div>
    `;
  }
  
  html += `
      <p><strong>Duration:</strong> ${formatDuration(crawlJob.duration)}</p>
      <p>You can view the full results in your dashboard.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Go to Dashboard
        </a>
      </p>
      <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
        Best regards,<br>
        Job Application SaaS Team
      </p>
    </div>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(duration) {
  if (!duration) return 'N/A';
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Initialize on module load if configured
if (isConfigured()) {
  initialize();
}

module.exports = {
  initialize,
  isConfigured,
  sendEmail,
  sendCrawlCompletionNotification
};
