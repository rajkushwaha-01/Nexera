const { sendError } = require('../utils/apiResponse');

const VALID_ASSIGNMENT_STATUSES = ['Pending', 'In Progress', 'Completed'];
const VALID_EXAM_STATUSES = ['Upcoming', 'Completed'];

/**
 * Validate Assignment Creation
 */
const validateAssignmentCreate = (req, res, next) => {
  const { subject, title, deadline, estimatedEffort, importance, difficulty, status } = req.body;
  const errors = [];

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push({ field: 'subject', message: 'Subject is required' });
  }

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Title is required and must be at least 2 characters long' });
  }

  if (!deadline || isNaN(Date.parse(deadline))) {
    errors.push({ field: 'deadline', message: 'A valid deadline date is required' });
  }

  if (estimatedEffort === undefined || typeof estimatedEffort !== 'number' || estimatedEffort <= 0) {
    errors.push({ field: 'estimatedEffort', message: 'Estimated effort in hours must be greater than 0' });
  }

  if (importance !== undefined && (!Number.isInteger(importance) || importance < 1 || importance > 5)) {
    errors.push({ field: 'importance', message: 'Importance must be an integer between 1 and 5' });
  }

  if (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be an integer between 1 and 5' });
  }

  if (status && !VALID_ASSIGNMENT_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_ASSIGNMENT_STATUSES.join(', ')}` });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for assignment creation', errors);
  }

  req.body.subject = subject.trim();
  req.body.title = title.trim();
  next();
};

/**
 * Validate Assignment Update
 */
const validateAssignmentUpdate = (req, res, next) => {
  const { subject, title, deadline, estimatedEffort, importance, difficulty, status } = req.body;
  const errors = [];

  if (subject !== undefined && (typeof subject !== 'string' || subject.trim().length === 0)) {
    errors.push({ field: 'subject', message: 'Subject cannot be empty' });
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push({ field: 'title', message: 'Title must be at least 2 characters long' });
  }

  if (deadline !== undefined && isNaN(Date.parse(deadline))) {
    errors.push({ field: 'deadline', message: 'Invalid deadline date format' });
  }

  if (estimatedEffort !== undefined && (typeof estimatedEffort !== 'number' || estimatedEffort <= 0)) {
    errors.push({ field: 'estimatedEffort', message: 'Estimated effort must be greater than 0' });
  }

  if (importance !== undefined && (!Number.isInteger(importance) || importance < 1 || importance > 5)) {
    errors.push({ field: 'importance', message: 'Importance must be an integer between 1 and 5' });
  }

  if (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be an integer between 1 and 5' });
  }

  if (status !== undefined && !VALID_ASSIGNMENT_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_ASSIGNMENT_STATUSES.join(', ')}` });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for assignment update', errors);
  }

  if (subject) req.body.subject = subject.trim();
  if (title) req.body.title = title.trim();
  next();
};

/**
 * Validate Exam Creation
 */
const validateExamCreate = (req, res, next) => {
  const { subject, title, examDate, importance, difficulty, preparationHours, status } = req.body;
  const errors = [];

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push({ field: 'subject', message: 'Subject is required' });
  }

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push({ field: 'title', message: 'Exam title is required and must be at least 2 characters long' });
  }

  if (!examDate || isNaN(Date.parse(examDate))) {
    errors.push({ field: 'examDate', message: 'A valid exam date is required' });
  }

  if (preparationHours !== undefined && (typeof preparationHours !== 'number' || preparationHours <= 0)) {
    errors.push({ field: 'preparationHours', message: 'Preparation hours must be greater than 0' });
  }

  if (importance !== undefined && (!Number.isInteger(importance) || importance < 1 || importance > 5)) {
    errors.push({ field: 'importance', message: 'Importance must be an integer between 1 and 5' });
  }

  if (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be an integer between 1 and 5' });
  }

  if (status && !VALID_EXAM_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_EXAM_STATUSES.join(', ')}` });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for exam creation', errors);
  }

  req.body.subject = subject.trim();
  req.body.title = title.trim();
  next();
};

/**
 * Validate Exam Update
 */
const validateExamUpdate = (req, res, next) => {
  const { subject, title, examDate, importance, difficulty, preparationHours, status } = req.body;
  const errors = [];

  if (subject !== undefined && (typeof subject !== 'string' || subject.trim().length === 0)) {
    errors.push({ field: 'subject', message: 'Subject cannot be empty' });
  }

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push({ field: 'title', message: 'Exam title must be at least 2 characters long' });
  }

  if (examDate !== undefined && isNaN(Date.parse(examDate))) {
    errors.push({ field: 'examDate', message: 'Invalid exam date format' });
  }

  if (preparationHours !== undefined && (typeof preparationHours !== 'number' || preparationHours <= 0)) {
    errors.push({ field: 'preparationHours', message: 'Preparation hours must be greater than 0' });
  }

  if (importance !== undefined && (!Number.isInteger(importance) || importance < 1 || importance > 5)) {
    errors.push({ field: 'importance', message: 'Importance must be an integer between 1 and 5' });
  }

  if (difficulty !== undefined && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be an integer between 1 and 5' });
  }

  if (status !== undefined && !VALID_EXAM_STATUSES.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_EXAM_STATUSES.join(', ')}` });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed for exam update', errors);
  }

  if (subject) req.body.subject = subject.trim();
  if (title) req.body.title = title.trim();
  next();
};

module.exports = {
  validateAssignmentCreate,
  validateAssignmentUpdate,
  validateExamCreate,
  validateExamUpdate
};
