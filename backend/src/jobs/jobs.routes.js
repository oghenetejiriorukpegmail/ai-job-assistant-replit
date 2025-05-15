/**
 * Jobs routes
 * Handles job matching and related endpoints
 */

const express = require('express');
const router = express.Router();
const jobsController = require('./jobs.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @route GET /api/jobs/match
 * @desc Get matched jobs based on user preferences and resume
 * @access Private
 */
router.get('/match', authMiddleware, jobsController.getMatchedJobs);

/**
 * @route GET /api/jobs/search
 * @desc Search for jobs
 * @access Private
 */
router.get('/search', authMiddleware, jobsController.searchJobs);

/**
 * @route GET /api/jobs/:id
 * @desc Get a job by ID
 * @access Private
 */
router.get('/:id', authMiddleware, jobsController.getJobById);

/**
 * @route GET /api/jobs/:id/similar
 * @desc Get similar jobs
 * @access Private
 */
router.get('/:id/similar', authMiddleware, jobsController.getSimilarJobs);

/**
 * @route POST /api/jobs/crawl
 * @desc Start a job crawl
 * @access Admin
 */
router.post('/crawl', authMiddleware, adminMiddleware, jobsController.startCrawl);

/**
 * @route GET /api/jobs/crawl/:id
 * @desc Get crawl status
 * @access Admin
 */
router.get('/crawl/status/:id', authMiddleware, adminMiddleware, jobsController.getCrawlStatus);

/**
 * @route GET /api/jobs/crawl/active
 * @desc Get active crawls
 * @access Admin
 */
router.get('/crawl/active', authMiddleware, adminMiddleware, jobsController.getActiveCrawls);

/**
 * @route GET /api/jobs/crawl/history
 * @desc Get crawl history
 * @access Admin
 */
router.get('/crawl/history', authMiddleware, adminMiddleware, jobsController.getCrawlHistory);

/**
 * @route POST /api/jobs/schedule
 * @desc Schedule a recurring crawl
 * @access Admin
 */
router.post('/schedule/create', authMiddleware, adminMiddleware, jobsController.scheduleRecurringCrawl);

/**
 * @route DELETE /api/jobs/schedule/cancel/:id
 * @desc Cancel a scheduled crawl
 * @access Admin
 */
router.delete('/schedule/cancel/:id', authMiddleware, adminMiddleware, jobsController.cancelScheduledCrawl);

/**
 * @route GET /api/jobs/schedule/list
 * @desc Get scheduled crawls
 * @access Admin
 */
router.get('/schedule/list', authMiddleware, adminMiddleware, jobsController.getScheduledCrawls);

/**
 * @route GET /api/jobs/stats
 * @desc Get crawl statistics
 * @access Admin
 */
router.get('/stats', authMiddleware, adminMiddleware, jobsController.getCrawlStats);

/**
 * @route GET /api/jobs/export/crawls
 * @desc Export crawl results
 * @access Admin
 */
router.get('/export/crawls', authMiddleware, adminMiddleware, jobsController.exportCrawlResults);

/**
 * @route GET /api/jobs/export/stats
 * @desc Export crawl statistics
 * @access Admin
 */
router.get('/export/stats', authMiddleware, adminMiddleware, jobsController.exportCrawlStats);

/**
 * @route GET /api/jobs/export/jobs
 * @desc Export jobs data
 * @access Admin
 */
router.get('/export/jobs', authMiddleware, adminMiddleware, jobsController.exportJobs);

module.exports = router;
