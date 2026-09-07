const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectUpdate = require('../models/ProjectUpdate');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Post a new project status update / activity
 * @route   POST /api/projects/:projectId/updates
 * @access  Private (Members/Admin)
 */
const createProjectUpdate = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { text, progress, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    throw new AppError('Update text is required and must be at least 3 characters long', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.owner.toString() === req.user.id.toString();
  const isMember = project.members.some((m) => m.toString() === req.user.id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isMember && !isAdmin) {
    throw new AppError('Forbidden: You are not authorized to post updates to this project', 403);
  }

  // Create update document
  const projectUpdate = await ProjectUpdate.create({
    project: projectId,
    author: req.user.id,
    text: text.trim(),
    progress: progress !== undefined ? progress : null,
    status: status || null
  });

  // If status or progress explicitly declared in update, sync project
  const projectChanges = {};
  if (status && ['Planning', 'Active', 'At Risk', 'Completed', 'On Hold'].includes(status)) {
    projectChanges.status = status;
  }
  if (progress !== undefined && typeof progress === 'number' && progress >= 0 && progress <= 100) {
    projectChanges.progress = progress;
  }

  if (Object.keys(projectChanges).length > 0) {
    await Project.findByIdAndUpdate(projectId, { $set: projectChanges });
  }

  const populated = await ProjectUpdate.findById(projectUpdate._id)
    .populate('author', 'name email avatar role title');

  return sendSuccess(res, 201, 'Project status update posted successfully', {
    update: populated
  });
});

/**
 * @desc    Get project updates timeline / activity feed
 * @route   GET /api/projects/:projectId/updates
 * @access  Private (Members/Admin)
 */
const getProjectUpdates = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.owner.toString() === req.user.id.toString();
  const isMember = project.members.some((m) => m.toString() === req.user.id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isMember && !isAdmin) {
    throw new AppError('Forbidden: You do not have access to view this project\'s updates', 403);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [updates, total] = await Promise.all([
    ProjectUpdate.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email avatar role title'),
    ProjectUpdate.countDocuments({ project: projectId })
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return sendSuccess(
    res,
    200,
    'Project updates retrieved successfully',
    { updates },
    {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  );
});

module.exports = {
  createProjectUpdate,
  getProjectUpdates
};
