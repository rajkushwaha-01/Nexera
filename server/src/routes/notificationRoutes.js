const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { AppError, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkUpcomingDeadlines } = require('../services/reminderScheduler');
const NotificationLog = require('../models/NotificationLog');

// All notification endpoints require authentication
router.use(protect);

/**
 * @desc    Trigger deadline check simulation for development/testing
 * @route   POST /api/notifications/test-deadline
 * @access  Private (Development / Testing Only)
 */
router.post(
  '/test-deadline',
  asyncHandler(async (req, res) => {
    // Strictly forbidden in production
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('This testing endpoint is strictly disabled in production environments', 403);
    }

    const { simulatedNow } = req.body;
    const refTime = simulatedNow ? new Date(simulatedNow) : new Date();

    if (simulatedNow && isNaN(refTime.getTime())) {
      throw new AppError('Invalid simulatedNow date format. Please provide a valid ISO timestamp', 400);
    }

    const results = await checkUpcomingDeadlines(refTime);

    return sendSuccess(res, 200, 'Deadline notification check completed', {
      simulatedReferenceTime: refTime.toISOString(),
      results
    });
  })
);

/**
 * @desc    View recent notification audit logs
 * @route   GET /api/notifications/logs
 * @access  Private
 */
router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const logs = await NotificationLog.find()
      .sort({ sentAt: -1 })
      .limit(50)
      .populate('recipient', 'name email');

    return sendSuccess(res, 200, 'Notification logs retrieved', { logs, count: logs.length });
  })
);

module.exports = router;
