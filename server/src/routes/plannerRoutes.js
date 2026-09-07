const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/plannerController');
const { protect } = require('../middleware/auth');
const {
  validateAssignmentCreate,
  validateAssignmentUpdate,
  validateExamCreate,
  validateExamUpdate
} = require('../middleware/plannerValidate');

// All planner routes require authentication
router.use(protect);

// Prioritization and recommendation endpoints
router.get('/priorities', getPriorities);
router.get('/recommendation', getRecommendation);
router.get('/schedule', getSchedule);

// Study availability
router.route('/availability')
  .get(getAvailability)
  .put(updateAvailability);

// Assignments CRUD
router.route('/assignments')
  .post(validateAssignmentCreate, createAssignment)
  .get(getAssignments);

router.route('/assignments/:id')
  .get(getAssignmentById)
  .put(validateAssignmentUpdate, updateAssignment)
  .delete(deleteAssignment);

// Exams CRUD
router.route('/exams')
  .post(validateExamCreate, createExam)
  .get(getExams);

router.route('/exams/:id')
  .get(getExamById)
  .put(validateExamUpdate, updateExam)
  .delete(deleteExam);

module.exports = router;
