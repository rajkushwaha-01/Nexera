const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

const VALID_PROJECT_STATUSES = ['Planning', 'Active', 'At Risk', 'Completed', 'On Hold'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked'];

/**
 * Validate Project Creation Body
 */
const validateProjectCreate = (req, res, next) => {
  const { title, deadline, status, priority, members } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Project title is required and must be at least 2 characters' });
  }

  if (!deadline || isNaN(Date.parse(deadline))) {
    errors.push({ field: 'deadline', message: 'A valid project deadline date is required' });
  }

  if (status && !VALID_PROJECT_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}` });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (members && Array.isArray(members)) {
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        errors.push({ field: 'members', message: `Invalid member ID format: ${memberId}` });
        break;
      }
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for project creation', errors);
  }

  if (title) req.body.title = title.trim();
  next();
};

/**
 * Validate Project Update Body
 */
const validateProjectUpdate = (req, res, next) => {
  const { title, deadline, status, priority, progress, members } = req.body;
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push({ field: 'title', message: 'Project title must be at least 2 characters' });
  }

  if (deadline !== undefined && isNaN(Date.parse(deadline))) {
    errors.push({ field: 'deadline', message: 'Provided deadline is not a valid date' });
  }

  if (status !== undefined && !VALID_PROJECT_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}` });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
    errors.push({ field: 'progress', message: 'Progress must be a number between 0 and 100' });
  }

  if (members !== undefined && Array.isArray(members)) {
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        errors.push({ field: 'members', message: `Invalid member ID format: ${memberId}` });
        break;
      }
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for project update', errors);
  }

  if (title) req.body.title = title.trim();
  next();
};

/**
 * Validate Task Creation Body
 */
const validateTaskCreate = (req, res, next) => {
  const { title, assignedTo, priority, status, dueDate, estimatedEffort } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Task title is required and must be at least 2 characters' });
  }

  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    errors.push({ field: 'assignedTo', message: 'Invalid assigned user ID format' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (status && !VALID_TASK_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_TASK_STATUSES.join(', ')}` });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    errors.push({ field: 'dueDate', message: 'Invalid due date format' });
  }

  if (estimatedEffort !== undefined && (typeof estimatedEffort !== 'number' || estimatedEffort < 0)) {
    errors.push({ field: 'estimatedEffort', message: 'Estimated effort must be a positive number of hours' });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for task creation', errors);
  }

  if (title) req.body.title = title.trim();
  next();
};

/**
 * Validate Task Update Body
 */
const validateTaskUpdate = (req, res, next) => {
  const { title, assignedTo, priority, status, dueDate, estimatedEffort, actualEffort, progress } = req.body;
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push({ field: 'title', message: 'Task title must be at least 2 characters' });
  }

  if (assignedTo !== undefined && assignedTo !== null && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    errors.push({ field: 'assignedTo', message: 'Invalid assigned user ID format' });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (status !== undefined && !VALID_TASK_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_TASK_STATUSES.join(', ')}` });
  }

  if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
    errors.push({ field: 'dueDate', message: 'Invalid due date format' });
  }

  if (estimatedEffort !== undefined && (typeof estimatedEffort !== 'number' || estimatedEffort < 0)) {
    errors.push({ field: 'estimatedEffort', message: 'Estimated effort must be a positive number' });
  }

  if (actualEffort !== undefined && (typeof actualEffort !== 'number' || actualEffort < 0)) {
    errors.push({ field: 'actualEffort', message: 'Actual effort must be a positive number' });
  }

  if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
    errors.push({ field: 'progress', message: 'Progress must be a number between 0 and 100' });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for task update', errors);
  }

  if (title) req.body.title = title.trim();
  next();
};

module.exports = {
  validateProjectCreate,
  validateProjectUpdate,
  validateTaskCreate,
  validateTaskUpdate
};
