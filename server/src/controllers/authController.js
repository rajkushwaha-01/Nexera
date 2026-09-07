const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, title, department, weeklyStudyHours } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email address already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    title: title || (role === 'project_manager' ? 'Project Manager' : role === 'student' ? 'Student' : 'Team Member'),
    department: department || 'General',
    weeklyStudyHours: weeklyStudyHours || undefined
  });

  const token = generateToken(user._id, user.role);

  return sendSuccess(res, 201, 'User registered successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      department: user.department,
      weeklyStudyHours: user.weeklyStudyHours,
      createdAt: user.createdAt
    },
    token
  });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive. Please contact support.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id, user.role);

  return sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      department: user.department,
      weeklyStudyHours: user.weeklyStudyHours,
      createdAt: user.createdAt
    },
    token
  });
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sendSuccess(res, 200, 'User profile retrieved', { user });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'title', 'department', 'avatar', 'weeklyStudyHours'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Incorrect current password', 400);
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 200, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
