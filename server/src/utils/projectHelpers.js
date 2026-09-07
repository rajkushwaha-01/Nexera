const mongoose = require('mongoose');

/**
 * Recalculate project progress based on its tasks
 * @param {string|mongoose.Types.ObjectId} projectId
 * @returns {Promise<number>}
 */
const syncProjectProgress = async (projectId) => {
  const Task = mongoose.model('Task');
  const Project = mongoose.model('Project');

  const tasks = await Task.find({ project: projectId });

  if (!tasks || tasks.length === 0) {
    return 0;
  }

  const project = await Project.findById(projectId);
  if (!project) return 0;

  const totalProgress = tasks.reduce((sum, task) => {
    if (task.status === 'Completed') return sum + 100;
    return sum + (Number(task.progress) || 0);
  }, 0);

  const averageProgress = Math.min(100, Math.round(totalProgress / tasks.length));

  const updateData = { progress: averageProgress };
  const allCompleted = tasks.length > 0 && tasks.every((t) => t.status === 'Completed');

  if (allCompleted && averageProgress === 100) {
    updateData.status = 'Completed';
  } else if (!allCompleted && project.status === 'Completed') {
    updateData.status = 'Active';
  }

  await Project.findByIdAndUpdate(projectId, updateData);
  return averageProgress;
};

/**
 * Build Mongoose query for deadline timeframe filtering
 * @param {string} filter 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'upcoming'
 * @param {string} fieldName 'deadline' or 'dueDate'
 * @returns {object}
 */
const buildDeadlineFilter = (filter, fieldName = 'deadline') => {
  if (!filter) return {};

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter.toLowerCase()) {
    case 'overdue':
      return { [fieldName]: { $lt: startOfToday } };

    case 'today':
      return { [fieldName]: { $gte: startOfToday, $lte: endOfToday } };

    case 'tomorrow': {
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const endOfTomorrow = new Date(endOfToday);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      return { [fieldName]: { $gte: startOfTomorrow, $lte: endOfTomorrow } };
    }

    case 'this_week': {
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return { [fieldName]: { $gte: startOfToday, $lte: endOfWeek } };
    }

    case 'upcoming':
      return { [fieldName]: { $gte: startOfToday } };

    default:
      return {};
  }
};

module.exports = {
  syncProjectProgress,
  buildDeadlineFilter
};
