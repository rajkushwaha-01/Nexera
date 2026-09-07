const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { validateTaskUpdate } = require('../middleware/projectValidate');

// All task routes require authentication
router.use(protect);

router.route('/:id')
  .get(getTaskById)
  .put(validateTaskUpdate, updateTask)
  .delete(deleteTask);

module.exports = router;
