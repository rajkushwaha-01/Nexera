const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const User = require('../models/User');
const StudyAvailability = require('../models/StudyAvailability');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  evaluatePriority,
  generateStudySchedule
} = require('../utils/prioritizationEngine');

// ----------------------------------------------------
// ASSIGNMENTS CRUD
// ----------------------------------------------------

const createAssignment = asyncHandler(async (req, res) => {
  const { subject, title, description, deadline, estimatedEffort, importance, difficulty, status } = req.body;

  const assignment = await Assignment.create({
    student: req.user.id,
    subject,
    title,
    description: description || '',
    deadline,
    estimatedEffort,
    importance: importance || 3,
    difficulty: difficulty || 3,
    status: status || 'Pending'
  });

  return sendSuccess(res, 201, 'Assignment created successfully', { assignment });
});

const getAssignments = asyncHandler(async (req, res) => {
  const { status, subject, difficulty, importance, search, sortBy = 'deadline', sortOrder = 'asc' } = req.query;

  const query = { student: req.user.id };

  if (status) query.status = status;
  if (subject) query.subject = { $regex: subject, $options: 'i' };
  if (difficulty) query.difficulty = Number(difficulty);
  if (importance) query.importance = Number(importance);

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { subject: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const sortDirections = { asc: 1, desc: -1 };
  const sort = { [sortBy]: sortDirections[sortOrder.toLowerCase()] || 1 };

  const assignments = await Assignment.find(query).sort(sort);

  return sendSuccess(res, 200, 'Assignments retrieved successfully', {
    assignments,
    count: assignments.length
  });
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid assignment ID format', 400);
  }

  const assignment = await Assignment.findOne({ _id: id, student: req.user.id });
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  return sendSuccess(res, 200, 'Assignment retrieved successfully', { assignment });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid assignment ID format', 400);
  }

  const allowedFields = [
    'subject',
    'title',
    'description',
    'deadline',
    'estimatedEffort',
    'importance',
    'difficulty',
    'status'
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.deadline !== undefined) {
    updates.deadlineReminder24Sent = false;
    updates.deadlineReminder1hSent = false;
    updates.lastNotifiedDeadline = null;
  }

  const updatedAssignment = await Assignment.findOneAndUpdate(
    { _id: id, student: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedAssignment) {
    throw new AppError('Assignment not found or unauthorized', 404);
  }

  return sendSuccess(res, 200, 'Assignment updated successfully', { assignment: updatedAssignment });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid assignment ID format', 400);
  }

  const deleted = await Assignment.findOneAndDelete({ _id: id, student: req.user.id });
  if (!deleted) {
    throw new AppError('Assignment not found or unauthorized', 404);
  }

  return sendSuccess(res, 200, 'Assignment deleted successfully', { deletedId: id });
});

// ----------------------------------------------------
// EXAMS CRUD
// ----------------------------------------------------

const createExam = asyncHandler(async (req, res) => {
  const { subject, title, examDate, importance, difficulty, preparationHours, status } = req.body;

  const exam = await Exam.create({
    student: req.user.id,
    subject,
    title,
    examDate,
    importance: importance || 4,
    difficulty: difficulty || 3,
    preparationHours: preparationHours || 10,
    status: status || 'Upcoming'
  });

  return sendSuccess(res, 201, 'Exam created successfully', { exam });
});

const getExams = asyncHandler(async (req, res) => {
  const { status, subject, search, sortBy = 'examDate', sortOrder = 'asc' } = req.query;

  const query = { student: req.user.id };

  if (status) query.status = status;
  if (subject) query.subject = { $regex: subject, $options: 'i' };

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { subject: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const sortDirections = { asc: 1, desc: -1 };
  const sort = { [sortBy]: sortDirections[sortOrder.toLowerCase()] || 1 };

  const exams = await Exam.find(query).sort(sort);

  return sendSuccess(res, 200, 'Exams retrieved successfully', {
    exams,
    count: exams.length
  });
});

const getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid exam ID format', 400);
  }

  const exam = await Exam.findOne({ _id: id, student: req.user.id });
  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  return sendSuccess(res, 200, 'Exam retrieved successfully', { exam });
});

const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid exam ID format', 400);
  }

  const allowedFields = [
    'subject',
    'title',
    'examDate',
    'importance',
    'difficulty',
    'preparationHours',
    'status'
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.examDate !== undefined) {
    updates.deadlineReminder24Sent = false;
    updates.deadlineReminder1hSent = false;
    updates.lastNotifiedDeadline = null;
  }

  const updatedExam = await Exam.findOneAndUpdate(
    { _id: id, student: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedExam) {
    throw new AppError('Exam not found or unauthorized', 404);
  }

  return sendSuccess(res, 200, 'Exam updated successfully', { exam: updatedExam });
});

const deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid exam ID format', 400);
  }

  const deleted = await Exam.findOneAndDelete({ _id: id, student: req.user.id });
  if (!deleted) {
    throw new AppError('Exam not found or unauthorized', 404);
  }

  return sendSuccess(res, 200, 'Exam deleted successfully', { deletedId: id });
});

// ----------------------------------------------------
// STUDY AVAILABILITY
// ----------------------------------------------------

const getAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('weeklyStudyHours');
  const overrides = await StudyAvailability.find({ student: req.user.id });

  const hours = {
    monday: 2,
    tuesday: 2,
    wednesday: 2,
    thursday: 2,
    friday: 2,
    saturday: 4,
    sunday: 4,
    ...(user.weeklyStudyHours || {})
  };

  overrides.forEach((o) => {
    hours[o.dayOfWeek] = o.availableHours;
  });

  return sendSuccess(res, 200, 'Study availability retrieved', { weeklyStudyHours: hours });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const { weeklyStudyHours } = req.body;

  if (!weeklyStudyHours || typeof weeklyStudyHours !== 'object') {
    throw new AppError('weeklyStudyHours object is required', 400);
  }

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const sanitizedHours = {};

  for (const day of validDays) {
    if (weeklyStudyHours[day] !== undefined) {
      const val = Number(weeklyStudyHours[day]);
      if (isNaN(val) || val < 0 || val > 24) {
        throw new AppError(`Hours for ${day} must be a number between 0 and 24`, 400);
      }
      sanitizedHours[day] = val;

      await StudyAvailability.findOneAndUpdate(
        { student: req.user.id, dayOfWeek: day },
        { availableHours: val },
        { upsert: true, new: true }
      );
    }
  }

  // Update on user document
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { weeklyStudyHours: sanitizedHours } },
    { new: true }
  ).select('weeklyStudyHours');

  return sendSuccess(res, 200, 'Study availability updated successfully', {
    weeklyStudyHours: user.weeklyStudyHours
  });
});

// ----------------------------------------------------
// PRIORITIZATION & RECOMMENDATION ENGINE APIs
// ----------------------------------------------------

/**
 * Helper to fetch all active student work items and rank them
 */
const getRankedItemsForStudent = async (userId) => {
  const user = await User.findById(userId).select('weeklyStudyHours');
  const weeklyHours = user ? user.weeklyStudyHours : {};

  const [assignments, exams] = await Promise.all([
    Assignment.find({ student: userId, status: { $ne: 'Completed' } }).lean(),
    Exam.find({ student: userId, status: { $ne: 'Completed' } }).lean()
  ]);

  const rawItems = [
    ...assignments.map((a) => ({ ...a, type: 'assignment' })),
    ...exams.map((e) => ({ ...e, type: 'exam' }))
  ];

  const evaluated = rawItems.map((item) => evaluatePriority(item, weeklyHours));

  // Sort descending by priorityScore
  evaluated.sort((a, b) => b.priorityScore - a.priorityScore);

  return { evaluated, weeklyHours };
};

/**
 * @desc    Get intelligent prioritized list of all student work items
 * @route   GET /api/planner/priorities
 * @access  Private
 */
const getPriorities = asyncHandler(async (req, res) => {
  const { evaluated } = await getRankedItemsForStudent(req.user.id);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Categorize
  const categorized = {
    critical: evaluated.filter((i) => i.priorityCategory === 'Critical'),
    high: evaluated.filter((i) => i.priorityCategory === 'High'),
    medium: evaluated.filter((i) => i.priorityCategory === 'Medium'),
    low: evaluated.filter((i) => i.priorityCategory === 'Low')
  };

  // Intelligence groupings
  const intelligence = {
    overdue: evaluated.filter((i) => i.isOverdue),
    dueToday: evaluated.filter((i) => !i.isOverdue && new Date(i.dueDate) <= new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)),
    dueTomorrow: evaluated.filter((i) => !i.isOverdue && new Date(i.dueDate) > new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1) && new Date(i.dueDate) <= endOfTomorrow),
    dueThisWeek: evaluated.filter((i) => !i.isOverdue && new Date(i.dueDate) <= endOfWeek),
    highRiskAssignments: evaluated.filter((i) => i.type === 'assignment' && i.effortDeficit),
    urgentExams: evaluated.filter((i) => i.type === 'exam' && i.daysRemaining <= 3)
  };

  return sendSuccess(res, 200, 'Prioritized work items retrieved', {
    items: evaluated,
    count: evaluated.length,
    categorized,
    intelligence
  });
});

/**
 * @desc    Get actionable recommendation for "What to work on next?"
 * @route   GET /api/planner/recommendation
 * @access  Private
 */
const getRecommendation = asyncHandler(async (req, res) => {
  const { evaluated } = await getRankedItemsForStudent(req.user.id);

  if (evaluated.length === 0) {
    return sendSuccess(res, 200, 'No pending work items found', {
      recommendation: null,
      message: 'All caught up! No pending assignments or exams scheduled.'
    });
  }

  const top = evaluated[0];
  const backup = evaluated.length > 1 ? evaluated[1] : null;

  return sendSuccess(res, 200, 'Next actionable recommendation generated', {
    recommendation: {
      item: top,
      reason: top.reason,
      priorityScore: top.priorityScore,
      priorityCategory: top.priorityCategory,
      estimatedEffort: top.type === 'exam' ? top.preparationHours : top.estimatedEffort,
      deadline: top.dueDate,
      urgency: top.isOverdue ? 'CRITICAL_OVERDUE' : top.hoursRemaining <= 24 ? 'URGENT_TODAY' : top.priorityCategory.toUpperCase(),
      suggestedFocusBlockHours: Math.min(2, top.type === 'exam' ? top.preparationHours : top.estimatedEffort)
    },
    backupRecommendation: backup
      ? {
          item: backup,
          reason: backup.reason,
          priorityScore: backup.priorityScore,
          priorityCategory: backup.priorityCategory
        }
      : null
  });
});

/**
 * @desc    Generate optimized study schedule avoiding overbooking
 * @route   GET /api/planner/schedule
 * @access  Private
 */
const getSchedule = asyncHandler(async (req, res) => {
  const { evaluated, weeklyHours } = await getRankedItemsForStudent(req.user.id);

  const scheduleData = generateStudySchedule(evaluated, weeklyHours);

  return sendSuccess(res, 200, '7-Day study schedule generated', scheduleData);
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getAvailability,
  updateAvailability,
  getPriorities,
  getRecommendation,
  getSchedule
};
