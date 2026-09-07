const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const {
  createTask,
  getTasksForProject
} = require('../controllers/taskController');
const {
  addProjectMember,
  removeProjectMember,
  getProjectMembers
} = require('../controllers/teamController');
const {
  createProjectUpdate,
  getProjectUpdates
} = require('../controllers/updateController');
const { protect } = require('../middleware/auth');
const {
  validateProjectCreate,
  validateProjectUpdate,
  validateTaskCreate
} = require('../middleware/projectValidate');

// All project routes require authentication
router.use(protect);

// Project CRUD
router.route('/')
  .post(validateProjectCreate, createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(validateProjectUpdate, updateProject)
  .delete(deleteProject);

// Nested task routes for a project
router.route('/:projectId/tasks')
  .post(validateTaskCreate, createTask)
  .get(getTasksForProject);

// Project members routes
router.route('/:projectId/members')
  .post(addProjectMember)
  .get(getProjectMembers);

router.route('/:projectId/members/:userId')
  .delete(removeProjectMember);

// Project status updates routes
router.route('/:projectId/updates')
  .post(createProjectUpdate)
  .get(getProjectUpdates);

module.exports = router;
