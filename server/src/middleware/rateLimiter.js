const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

// Standard API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 500, // relaxed during tests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 429, 'Too many requests from this IP. Please try again after 15 minutes.');
  }
});

// Strict Auth Limiter (for login and registration)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 50, // 50 attempts per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 429, 'Too many authentication attempts. Please try again after 15 minutes.');
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
