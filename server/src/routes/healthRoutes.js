const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const status = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none'
    }
  };

  return sendSuccess(res, 200, 'Service is healthy', status);
});

module.exports = router;
