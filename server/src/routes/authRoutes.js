const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate
} = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with brute-force protection
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, validateProfileUpdate, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
