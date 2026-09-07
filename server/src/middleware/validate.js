const { sendError } = require('../utils/apiResponse');

/**
 * Validate Registration Input
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters long' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  const validRoles = ['admin', 'member', 'student'];
  if (role && !validRoles.includes(role)) {
    errors.push({ field: 'role', message: `Role must be one of: ${validRoles.join(', ')}` });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for registration', errors);
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate Login Input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for login', errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate Profile Update Input
 */
const validateProfileUpdate = (req, res, next) => {
  const { name, weeklyStudyHours, role } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (weeklyStudyHours !== undefined) {
    if (typeof weeklyStudyHours !== 'object' || weeklyStudyHours === null) {
      errors.push({ field: 'weeklyStudyHours', message: 'weeklyStudyHours must be an object of day:hours' });
    }
  }

  // Prevent regular users from self-promoting without admin rights if role is passed
  if (role !== undefined) {
    const validRoles = ['admin', 'member', 'student'];
    if (!validRoles.includes(role)) {
      errors.push({ field: 'role', message: `Invalid role specified` });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for profile update', errors);
  }

  if (name) req.body.name = name.trim();
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate
};
