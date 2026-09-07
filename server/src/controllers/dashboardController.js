const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ProjectUpdate = require('../models/ProjectUpdate');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get centralized dashboard analytics and summary
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const isAdmin = req.user.role === 'admin';

  // Project scope filter
  const projectScope = isAdmin
    ? { isArchived: false }
    : { isArchived: false, $or: [{ owner: userId }, { members: userId }] };

  // Fetch all accessible projects
  const accessibleProjects = await Project.find(projectScope).select(
    '_id title status priority progress deadline startDate owner'
  );

  const projectIds = accessibleProjects.map((p) => p._id);

  // 1. Projects Breakdown
  const totalProjects = accessibleProjects.length;
  let activeProjects = 0;
  let completedProjects = 0;
  let atRiskProjects = 0;
  let planningProjects = 0;
  let onHoldProjects = 0;
  let totalProgressSum = 0;

  accessibleProjects.forEach((p) => {
    totalProgressSum += p.progress || 0;
    switch (p.status) {
      case 'Active':
        activeProjects++;
        break;
      case 'Completed':
        completedProjects++;
        break;
      case 'At Risk':
        atRiskProjects++;
        break;
      case 'Planning':
        planningProjects++;
        break;
      case 'On Hold':
        onHoldProjects++;
        break;
    }
  });

  const overallProjectProgress = totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0;

  // 2. Tasks Breakdown using Aggregation
  const now = new Date();
  const taskAggregation = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
        },
        reviewTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] }
        },
        todoTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] }
        },
        blockedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'Blocked'] }, 1, 0] }
        },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'Completed'] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalEstimatedHours: { $sum: '$estimatedEffort' },
        totalActualHours: { $sum: '$actualEffort' }
      }
    }
  ]);

  const taskStats = taskAggregation[0] || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    reviewTasks: 0,
    todoTasks: 0,
    blockedTasks: 0,
    overdueTasks: 0,
    totalEstimatedHours: 0,
    totalActualHours: 0
  };

  const pendingTasks = taskStats.totalTasks - taskStats.completedTasks;

  // 3. Upcoming Deadlines (Tasks & Projects due soon or overdue)
  const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [upcomingProjects, upcomingTasks] = await Promise.all([
    Project.find({
      _id: { $in: projectIds },
      status: { $ne: 'Completed' },
      deadline: { $lte: fourteenDaysLater }
    })
      .select('title deadline status priority progress')
      .sort({ deadline: 1 })
      .limit(6),

    Task.find({
      project: { $in: projectIds },
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $lte: fourteenDaysLater }
    })
      .select('title dueDate priority status project assignedTo')
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 })
      .limit(8)
  ]);

  // Unified upcoming deadlines feed
  const upcomingDeadlines = [
    ...upcomingProjects.map((p) => ({
      id: p._id,
      type: 'project',
      title: p.title,
      dueDate: p.deadline,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      isOverdue: new Date(p.deadline) < now
    })),
    ...upcomingTasks.map((t) => ({
      id: t._id,
      type: 'task',
      title: t.title,
      projectTitle: t.project ? t.project.title : 'Unknown Project',
      dueDate: t.dueDate,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo,
      isOverdue: new Date(t.dueDate) < now
    }))
  ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // 4. Recent Activity / Project Updates Feed
  const recentUpdates = await ProjectUpdate.find({ project: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('author', 'name email avatar role title')
    .populate('project', 'title status');

  return sendSuccess(res, 200, 'Dashboard summary analytics retrieved', {
    metrics: {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        atRisk: atRiskProjects,
        planning: planningProjects,
        onHold: onHoldProjects,
        overallProgress: overallProjectProgress
      },
      tasks: {
        total: taskStats.totalTasks,
        completed: taskStats.completedTasks,
        pending: pendingTasks,
        inProgress: taskStats.inProgressTasks,
        todo: taskStats.todoTasks,
        review: taskStats.reviewTasks,
        blocked: taskStats.blockedTasks,
        overdue: taskStats.overdueTasks,
        totalEstimatedHours: taskStats.totalEstimatedHours,
        totalActualHours: taskStats.totalActualHours
      }
    },
    upcomingDeadlines,
    recentUpdates
  });
});

module.exports = {
  getDashboardSummary
};
