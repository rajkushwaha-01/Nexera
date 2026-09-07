const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get complete API documentation specification
 * @route   GET /api/docs
 * @access  Public
 */
router.get('/', (req, res) => {
  const spec = {
    title: 'Web-Based Integrated Project-Monitoring Platform API',
    version: '1.0.0',
    description: 'Production REST API powering project monitoring, task workflows, team collaboration, and intelligent student study planning.',
    baseUrl: '/api',
    authScheme: 'Bearer JWT (Authorization: Bearer <token>)',
    modules: [
      {
        name: 'Authentication',
        endpoints: [
          { method: 'POST', path: '/api/auth/register', access: 'Public', desc: 'Register a new user account' },
          { method: 'POST', path: '/api/auth/login', access: 'Public', desc: 'Login with credentials and receive JWT' },
          { method: 'GET', path: '/api/auth/me', access: 'Private', desc: 'Get current authenticated user profile' },
          { method: 'PUT', path: '/api/auth/me', access: 'Private', desc: 'Update profile and weekly study schedule' },
          { method: 'PUT', path: '/api/auth/change-password', access: 'Private', desc: 'Change password securely' }
        ]
      },
      {
        name: 'Projects',
        endpoints: [
          { method: 'POST', path: '/api/projects', access: 'Private', desc: 'Create a new project' },
          { method: 'GET', path: '/api/projects', access: 'Private', desc: 'List projects with filtering, pagination, and sorting' },
          { method: 'GET', path: '/api/projects/:id', access: 'Private', desc: 'Get project details, members, and task list' },
          { method: 'PUT', path: '/api/projects/:id', access: 'Private (Owner/Admin)', desc: 'Update project configuration' },
          { method: 'DELETE', path: '/api/projects/:id', access: 'Private (Owner/Admin)', desc: 'Delete project and cascade delete tasks & updates' }
        ]
      },
      {
        name: 'Tasks',
        endpoints: [
          { method: 'POST', path: '/api/projects/:projectId/tasks', access: 'Private (Members/Admin)', desc: 'Create a task (auto-syncs project progress)' },
          { method: 'GET', path: '/api/projects/:projectId/tasks', access: 'Private (Members/Admin)', desc: 'List tasks for project' },
          { method: 'GET', path: '/api/tasks/:id', access: 'Private (Members/Admin)', desc: 'Get single task details' },
          { method: 'PUT', path: '/api/tasks/:id', access: 'Private (Members/Admin)', desc: 'Update task progress/status (auto-syncs project progress)' },
          { method: 'DELETE', path: '/api/tasks/:id', access: 'Private (Owner/Creator/Admin)', desc: 'Delete task and recalculate project progress' }
        ]
      },
      {
        name: 'Team & Workload',
        endpoints: [
          { method: 'POST', path: '/api/projects/:projectId/members', access: 'Private (Owner/Admin)', desc: 'Add member by userId or email' },
          { method: 'DELETE', path: '/api/projects/:projectId/members/:userId', access: 'Private (Owner/Admin)', desc: 'Remove member and unassign pending tasks' },
          { method: 'GET', path: '/api/projects/:projectId/members', access: 'Private (Members/Admin)', desc: 'Get project members with individual effort workload' },
          { method: 'GET', path: '/api/team/members', access: 'Private', desc: 'Get workspace-wide team directory with aggregated workload metrics' }
        ]
      },
      {
        name: 'Project Status Updates & Timeline',
        endpoints: [
          { method: 'POST', path: '/api/projects/:projectId/updates', access: 'Private (Members/Admin)', desc: 'Post status update (optionally syncs project status)' },
          { method: 'GET', path: '/api/projects/:projectId/updates', access: 'Private (Members/Admin)', desc: 'Get chronological activity feed of updates' }
        ]
      },
      {
        name: 'Dashboard Analytics',
        endpoints: [
          { method: 'GET', path: '/api/dashboard/summary', access: 'Private', desc: 'Centralized metrics, upcoming deadlines, and activity feed' }
        ]
      },
      {
        name: 'Student Planner & Prioritization Engine',
        endpoints: [
          { method: 'POST', path: '/api/planner/assignments', access: 'Private', desc: 'Create an assignment' },
          { method: 'GET', path: '/api/planner/assignments', access: 'Private', desc: 'List assignments with filters' },
          { method: 'GET', path: '/api/planner/assignments/:id', access: 'Private', desc: 'Get single assignment' },
          { method: 'PUT', path: '/api/planner/assignments/:id', access: 'Private', desc: 'Update assignment' },
          { method: 'DELETE', path: '/api/planner/assignments/:id', access: 'Private', desc: 'Delete assignment' },
          { method: 'POST', path: '/api/planner/exams', access: 'Private', desc: 'Create an exam' },
          { method: 'GET', path: '/api/planner/exams', access: 'Private', desc: 'List exams with filters' },
          { method: 'GET', path: '/api/planner/exams/:id', access: 'Private', desc: 'Get single exam' },
          { method: 'PUT', path: '/api/planner/exams/:id', access: 'Private', desc: 'Update exam' },
          { method: 'DELETE', path: '/api/planner/exams/:id', access: 'Private', desc: 'Delete exam' },
          { method: 'GET', path: '/api/planner/availability', access: 'Private', desc: 'Get student daily study availability' },
          { method: 'PUT', path: '/api/planner/availability', access: 'Private', desc: 'Update daily study hours' },
          { method: 'GET', path: '/api/planner/priorities', access: 'Private', desc: 'Multi-factor ranked work items with urgency categories' },
          { method: 'GET', path: '/api/planner/recommendation', access: 'Private', desc: 'Intelligent "What to work on next?" with rationale' },
          { method: 'GET', path: '/api/planner/schedule', access: 'Private', desc: '7-Day study schedule strictly respecting non-overbooking' }
        ]
      }
    ]
  };

  return sendSuccess(res, 200, 'API Documentation Specification', spec);
});

module.exports = router;
