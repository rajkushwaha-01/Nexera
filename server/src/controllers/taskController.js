const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const { syncProjectProgress, buildDeadlineFilter } = require('../utils/projectHelpers');

/**
 * Check if a user has access to a project (as owner, member, or admin)
 */
const checkProjectAccess = (project, user) => {
  if (user.role === 'admin') return true;
  const isOwner = project.owner.toString() === user.id.toString();
  const isMember = project.members.some((m) => m.toString() === user.id.toString());
  return isOwner || isMember;
};

/**
 * @desc    Create a task inside a project
 * @route   POST /api/projects/:projectId/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const {
    title,
    description,
    assignedTo,
    priority,
    status,
    dueDate,
    estimatedEffort,
    actualEffort,
    progress
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!checkProjectAccess(project, req.user)) {
    throw new AppError('Forbidden: You are not authorized to add tasks to this project', 403);
  }

  // If assignedTo is passed, ensure the user exists
  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new AppError('Invalid assigned user ID format', 400);
  }

  const initialProgress = status === 'Completed' ? 100 : (progress || 0);

  const task = await Task.create({
    project: projectId,
    title,
    description: description || '',
    assignedTo: assignedTo || null,
    priority: priority || 'Medium',
    status: status || 'Todo',
    dueDate: dueDate || null,
    estimatedEffort: estimatedEffort || 0,
    actualEffort: actualEffort || 0,
    progress: initialProgress,
    createdBy: req.user.id
  });

  // Re-sync parent project progress
  await syncProjectProgress(projectId);

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');

  return sendSuccess(res, 201, 'Task created successfully', { task: populated });
});

/**
 * @desc    Get all tasks for a specific project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private
 */
const getTasksForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const {
    status,
    priority,
    assignedTo,
    search,
    deadline,
    sortBy = 'dueDate',
    sortOrder = 'asc'
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!checkProjectAccess(project, req.user)) {
    throw new AppError('Forbidden: You are not authorized to view tasks for this project', 403);
  }

  const query = { project: projectId };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    query.assignedTo = assignedTo;
  }

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (deadline) {
    const deadlineQuery = buildDeadlineFilter(deadline, 'dueDate');
    Object.assign(query, deadlineQuery);
  }

  const sortDirections = { asc: 1, desc: -1 };
  const sort = { [sortBy]: sortDirections[sortOrder.toLowerCase()] || 1 };

  const tasks = await Task.find(query)
    .sort(sort)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');

  return sendSuccess(res, 200, 'Tasks retrieved successfully', {
    tasks,
    count: tasks.length
  });
});

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid task ID format', 400);
  }

  const task = await Task.findById(id)
    .populate('project', 'title status deadline owner members')
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!checkProjectAccess(task.project, req.user)) {
    throw new AppError('Forbidden: You do not have access to this task', 403);
  }

  return sendSuccess(res, 200, 'Task retrieved successfully', { task });
});

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid task ID format', 400);
  }

  const task = await Task.findById(id).populate('project');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (!checkProjectAccess(task.project, req.user)) {
    throw new AppError('Forbidden: You are not authorized to update this task', 403);
  }

  const allowedFields = [
    'title',
    'description',
    'assignedTo',
    'priority',
    'status',
    'dueDate',
    'estimatedEffort',
    'actualEffort',
    'progress'
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Auto-sync status and progress logic
  if (updates.status === 'Completed' && updates.progress === undefined) {
    updates.progress = 100;
  } else if (updates.progress === 100 && !updates.status) {
    updates.status = 'Completed';
  } else if (updates.progress !== undefined && updates.progress < 100 && task.status === 'Completed' && !updates.status) {
    updates.status = 'In Progress';
  }

  const updatedTask = await Task.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email avatar role');

  // Sync parent project progress
  await syncProjectProgress(task.project._id);

  return sendSuccess(res, 200, 'Task updated successfully', { task: updatedTask });
});

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid task ID format', 400);
  }

  const task = await Task.findById(id).populate('project');
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const isProjectOwner = task.project.owner.toString() === req.user.id.toString();
  const isCreator = task.createdBy.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isProjectOwner && !isCreator && !isAdmin) {
    throw new AppError('Forbidden: You are not authorized to delete this task', 403);
  }

  const projectId = task.project._id;
  await Task.findByIdAndDelete(id);

  // Re-sync parent project progress
  await syncProjectProgress(projectId);

  return sendSuccess(res, 200, 'Task deleted successfully', { deletedTaskId: id });
});

module.exports = {
  createTask,
  getTasksForProject,
  getTaskById,
  updateTask,
  deleteTask
};
