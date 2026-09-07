const { sendError } = require('../utils/apiResponse');

/**
 * Higher-order function to catch async errors in route controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return sendError(res, 404, message);
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return sendError(res, 409, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    return sendError(res, 400, 'Validation Error', errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token expired. Please log in again.');
  }

  // Operational error or unexpected
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('SERVER ERROR STACK:', err);
  }

  return sendError(res, statusCode, message, err.errors || null);
};

module.exports = {
  asyncHandler,
  errorHandler
};
