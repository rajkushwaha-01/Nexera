const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ProjectUpdate = require('../models/ProjectUpdate');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { buildDeadlineFilter } = require('../utils/projectHelpers');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const { title, description, startDate, deadline, status, priority, members } = req.body;

  // Combine owner and any passed members (deduplicating)
  const memberSet = new Set(members || []);
  memberSet.add(req.user.id.toString());
  const memberList = Array.from(memberSet);

  const project = await Project.create({
    title,
    description: description || '',
    owner: req.user.id,
    members: memberList,
    startDate: startDate || Date.now(),
    deadline,
    status: status || 'Planning',
    priority: priority || 'Medium',
    progress: 0
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'name email avatar role')
    .populate('members', 'name email avatar role');

  return sendSuccess(res, 201, 'Project created successfully', { project: populated });
});

/**
 * @desc    Get all projects with filtering, sorting, and pagination
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    member,
    search,
    deadline,
    isArchived,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Visibility: Admins see all; regular users see projects they own or are a member of
  if (req.user.role !== 'admin') {
    query.$or = [{ owner: req.user.id }, { members: req.user.id }];
  }

  // Archived filter
  if (isArchived !== undefined) {
    query.isArchived = isArchived === 'true';
  } else {
    query.isArchived = false;
  }

  // Status & Priority filters
  if (status) {
    query.status = status;
  }
  if (priority) {
    query.priority = priority;
  }

  // Member filter
  if (member) {
    if (mongoose.Types.ObjectId.isValid(member)) {
      query.members = member;
    }
  }

  // Title / Description search
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  // Deadline intelligence filter
  if (deadline) {
    const deadlineQuery = buildDeadlineFilter(deadline, 'deadline');
    Object.assign(query, deadlineQuery);
  }

  // Pagination & Sorting
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortDirections = { asc: 1, desc: -1 };
  const sort = { [sortBy]: sortDirections[sortOrder.toLowerCase()] || -1 };

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role'),
    Project.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return sendSuccess(
    res,
    200,
    'Projects retrieved successfully',
    { projects },
    {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  );
});

/**
 * @desc    Get project details by ID with populated members and tasks
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(id)
    .populate('owner', 'name email avatar role')
    .populate('members', 'name email avatar role');

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Access check: User must be owner, member, or admin
  const isOwner = project.owner._id.toString() === req.user.id.toString();
  const isMember = project.members.some((m) => m._id.toString() === req.user.id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isMember && !isAdmin) {
    throw new AppError('Access denied. You are not authorized to view this project.', 403);
  }

  // Load project's tasks
  const tasks = await Task.find({ project: id })
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ dueDate: 1, priority: -1 });

  return sendSuccess(res, 200, 'Project retrieved successfully', {
    project,
    tasks
  });
});

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Authorization: Only owner or admin can modify project configuration
  const isOwner = project.owner.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Forbidden: Only the project owner or an administrator can update this project', 403);
  }

  const allowedFields = [
    'title',
    'description',
    'startDate',
    'deadline',
    'status',
    'priority',
    'progress',
    'members',
    'isArchived'
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Ensure owner stays in members list if members updated
  if (updates.members && Array.isArray(updates.members)) {
    const memberSet = new Set(updates.members);
    memberSet.add(project.owner.toString());
    updates.members = Array.from(memberSet);
  }

  const updatedProject = await Project.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    .populate('owner', 'name email avatar role')
    .populate('members', 'name email avatar role');

  return sendSuccess(res, 200, 'Project updated successfully', { project: updatedProject });
});

/**
 * @desc    Delete project and cascade delete tasks
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Authorization: Only owner or admin
  const isOwner = project.owner.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Forbidden: Only the project owner or an administrator can delete this project', 403);
  }

  // Cascade delete all tasks and updates under this project
  await Task.deleteMany({ project: id });
  await ProjectUpdate.deleteMany({ project: id });
  await Project.findByIdAndDelete(id);

  return sendSuccess(res, 200, 'Project and associated tasks deleted successfully', {
    deletedProjectId: id
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
