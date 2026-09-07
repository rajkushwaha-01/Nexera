const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendSuccess, AppError } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:projectId/members
 * @access  Private (Owner/Admin)
 */
const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { userId, email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Authorization: Only owner or admin can add members
  const isOwner = project.owner.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Forbidden: Only project owner or administrator can add members', 403);
  }

  // Locate target user by userId or email
  let targetUser;
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID format', 400);
    }
    targetUser = await User.findById(userId);
  } else if (email) {
    targetUser = await User.findOne({ email: email.trim().toLowerCase() });
  } else {
    throw new AppError('Please provide a userId or email to add a member', 400);
  }

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if user is already a member
  const alreadyMember = project.members.some((m) => m.toString() === targetUser._id.toString());
  if (alreadyMember) {
    throw new AppError('User is already a member of this project', 400);
  }

  project.members.push(targetUser._id);
  await project.save();

  const updatedProject = await Project.findById(projectId)
    .populate('members', 'name email avatar role title department')
    .populate('owner', 'name email avatar role');

  return sendSuccess(res, 200, 'Member added to project successfully', {
    members: updatedProject.members
  });
});

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:projectId/members/:userId
 * @access  Private (Owner/Admin)
 */
const removeProjectMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid ID format', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isOwner = project.owner.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('Forbidden: Only project owner or administrator can remove members', 403);
  }

  // Prevent removing project owner
  if (project.owner.toString() === userId) {
    throw new AppError('Cannot remove project owner from project members', 400);
  }

  // Remove member
  project.members = project.members.filter((m) => m.toString() !== userId);
  await project.save();

  // Optionally unassign this user from any pending tasks in this project
  await Task.updateMany(
    { project: projectId, assignedTo: userId, status: { $ne: 'Completed' } },
    { $set: { assignedTo: null } }
  );

  const updatedProject = await Project.findById(projectId)
    .populate('members', 'name email avatar role title department');

  return sendSuccess(res, 200, 'Member removed from project successfully', {
    members: updatedProject.members
  });
});

/**
 * @desc    View project members with individual workload metrics
 * @route   GET /api/projects/:projectId/members
 * @access  Private (Members/Admin)
 */
const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project ID format', 400);
  }

  const project = await Project.findById(projectId).populate('members', 'name email avatar role title department');
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Access check
  const isOwner = project.owner.toString() === req.user.id.toString();
  const isMember = project.members.some((m) => m._id.toString() === req.user.id.toString());
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isMember && !isAdmin) {
    throw new AppError('Forbidden: You do not have access to view this project\'s members', 403);
  }

  // Compute workload for each member in this project using aggregation
  const projectTasks = await Task.find({ project: projectId });

  const membersWithWorkload = project.members.map((member) => {
    const memberTasks = projectTasks.filter(
      (t) => t.assignedTo && t.assignedTo.toString() === member._id.toString()
    );

    const totalTasks = memberTasks.length;
    const completedTasks = memberTasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const totalEstimatedEffort = memberTasks.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);
    const totalActualEffort = memberTasks.reduce((sum, t) => sum + (t.actualEffort || 0), 0);

    return {
      user: member,
      isOwner: project.owner.toString() === member._id.toString(),
      workload: {
        totalTasks,
        completedTasks,
        pendingTasks,
        totalEstimatedEffort,
        totalActualEffort
      }
    };
  });

  return sendSuccess(res, 200, 'Project members retrieved successfully', {
    members: membersWithWorkload
  });
});

/**
 * @desc    Get all workspace team members with overall workload metrics
 * @route   GET /api/team/members
 * @access  Private
 */
const getAllTeamMembers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('name email avatar role title department');

  // Aggregation for task workload across all tasks
  const taskWorkloadAggregation = await Task.aggregate([
    {
      $group: {
        _id: '$assignedTo',
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] }
        },
        totalEstimatedEffort: { $sum: '$estimatedEffort' },
        totalActualEffort: { $sum: '$actualEffort' }
      }
    }
  ]);

  // Aggregation for project count per member
  const projectWorkloadAggregation = await Project.aggregate([
    { $unwind: '$members' },
    {
      $group: {
        _id: '$members',
        assignedProjectsCount: { $sum: 1 }
      }
    }
  ]);

  const taskWorkloadMap = new Map();
  taskWorkloadAggregation.forEach((item) => {
    if (item._id) {
      taskWorkloadMap.set(item._id.toString(), item);
    }
  });

  const projectWorkloadMap = new Map();
  projectWorkloadAggregation.forEach((item) => {
    if (item._id) {
      projectWorkloadMap.set(item._id.toString(), item.assignedProjectsCount);
    }
  });

  const result = users.map((user) => {
    const uId = user._id.toString();
    const taskStats = taskWorkloadMap.get(uId) || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      totalEstimatedEffort: 0,
      totalActualEffort: 0
    };
    const assignedProjects = projectWorkloadMap.get(uId) || 0;

    return {
      user,
      workload: {
        assignedProjectsCount: assignedProjects,
        totalTasks: taskStats.totalTasks,
        completedTasks: taskStats.completedTasks,
        pendingTasks: taskStats.pendingTasks,
        totalEstimatedEffort: taskStats.totalEstimatedEffort,
        totalActualEffort: taskStats.totalActualEffort
      }
    };
  });

  return sendSuccess(res, 200, 'Team members retrieved successfully', { members: result });
});

module.exports = {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getAllTeamMembers
};
