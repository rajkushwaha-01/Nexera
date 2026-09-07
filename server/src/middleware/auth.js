const { verifyToken } = require('../utils/token');
const { AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('./errorHandler');
const User = require('../models/User');

/**
 * Protect routes: Authenticate user via JWT Bearer token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Access denied. No authentication token provided.', 401);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired authentication token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('User belonging to this token no longer exists.', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated. Please contact support.', 403);
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization guard
 * @param  {...string} roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(`Forbidden: User role '${req.user ? req.user.role : 'none'}' does not have access to this resource`, 403)
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
