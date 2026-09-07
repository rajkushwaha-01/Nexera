/**
 * Intelligent Prioritization Engine for Students
 * Multi-factor ranking: Deadline Proximity, Importance, Difficulty, Effort, Available Study Hours, and Exam Urgency
 */

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Calculate total available study hours between now and target date
 * @param {Date} targetDate
 * @param {object} weeklyHours { monday, tuesday, wednesday, thursday, friday, saturday, sunday }
 * @returns {number}
 */
const calculateAvailableHoursBeforeDate = (targetDate, weeklyHours = {}) => {
  const now = new Date();
  const target = new Date(targetDate);

  if (target <= now) return 0;

  let totalAvailable = 0;
  const current = new Date(now);

  // Default fallback if weeklyHours not fully populated
  const defaultHours = {
    monday: 2,
    tuesday: 2,
    wednesday: 2,
    thursday: 2,
    friday: 2,
    saturday: 4,
    sunday: 4,
    ...weeklyHours
  };

  while (current < target) {
    const dayName = DAYS_OF_WEEK[current.getDay()];
    const hoursForDay = Number(defaultHours[dayName]) || 0;

    // If it's the last day, calculate proportional hours remaining in day
    const isSameDay =
      current.getFullYear() === target.getFullYear() &&
      current.getMonth() === target.getMonth() &&
      current.getDate() === target.getDate();

    if (isSameDay) {
      const hoursRemainingInTargetDay = Math.max(0, target.getHours() - current.getHours());
      const fractionOfDay = Math.min(1, hoursRemainingInTargetDay / 24);
      totalAvailable += hoursForDay * fractionOfDay;
    } else {
      totalAvailable += hoursForDay;
    }

    // Step forward 1 day
    current.setDate(current.getDate() + 1);
  }

  return Math.round(totalAvailable * 10) / 10;
};

/**
 * Calculate Priority Score and classification for an item (Assignment or Exam)
 * @param {object} item { type, title, subject, deadline/examDate, importance, difficulty, estimatedEffort/preparationHours, status }
 * @param {object} weeklyHours
 * @returns {object} Ranked item with normalized score (0-100), category, and explainability breakdown
 */
const evaluatePriority = (item, weeklyHours = {}) => {
  const now = new Date();
  const dueDate = new Date(item.type === 'exam' ? item.examDate : item.deadline);
  const effort = Number(item.type === 'exam' ? item.preparationHours : item.estimatedEffort) || 1;
  const importance = Math.max(1, Math.min(5, Number(item.importance) || 3));
  const difficulty = Math.max(1, Math.min(5, Number(item.difficulty) || 3));

  const diffMs = dueDate - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const daysRemaining = Math.round((hoursRemaining / 24) * 10) / 10;
  const isOverdue = hoursRemaining < 0;

  // Available study hours before deadline
  const availableStudyHours = calculateAvailableHoursBeforeDate(dueDate, weeklyHours);
  const effortDeficit = effort > availableStudyHours && !isOverdue;

  // 1. Deadline Proximity Score (0 - 45 pts)
  let deadlineScore = 0;
  if (isOverdue) {
    deadlineScore = 45;
  } else if (hoursRemaining <= 24) {
    deadlineScore = 42 + Math.max(0, (24 - hoursRemaining) / 8); // 42-45
  } else if (hoursRemaining <= 48) {
    deadlineScore = 36 + ((48 - hoursRemaining) / 24) * 5; // 36-41
  } else if (daysRemaining <= 7) {
    deadlineScore = 25 + ((7 - daysRemaining) / 5) * 10; // 25-35
  } else if (daysRemaining <= 14) {
    deadlineScore = 15 + ((14 - daysRemaining) / 7) * 9; // 15-24
  } else {
    deadlineScore = Math.max(5, 14 - (daysRemaining - 14) * 0.5); // 5-14
  }

  // 2. Importance Score (0 - 20 pts)
  const importanceScore = (importance / 5) * 20;

  // 3. Difficulty Score (0 - 15 pts)
  const difficultyScore = (difficulty / 5) * 15;

  // 4. Effort vs Availability Risk Score (0 - 20 pts)
  let effortRiskScore = 0;
  if (isOverdue) {
    effortRiskScore = 20;
  } else {
    const ratio = effort / Math.max(0.5, availableStudyHours);
    if (ratio >= 1.0) effortRiskScore = 20;
    else if (ratio >= 0.7) effortRiskScore = 15;
    else if (ratio >= 0.4) effortRiskScore = 10;
    else if (ratio >= 0.2) effortRiskScore = 5;
    else effortRiskScore = 2;
  }

  // 5. Exam Urgency Bonus (0 - 5 pts)
  let examBonus = 0;
  if (item.type === 'exam') {
    if (daysRemaining <= 3 && !isOverdue) examBonus = 5;
    else if (daysRemaining <= 7 && !isOverdue) examBonus = 3;
  }

  // Raw Total Calculation
  let rawScore = deadlineScore + importanceScore + difficultyScore + effortRiskScore + examBonus;

  // Intelligent floors for critical scenarios
  if (isOverdue) {
    rawScore = Math.max(95, rawScore);
  } else if (hoursRemaining <= 24) {
    rawScore = Math.max(90, rawScore);
  } else if (item.type === 'exam' && daysRemaining <= 1.5) {
    rawScore = Math.max(92, rawScore);
  } else if (effortDeficit && daysRemaining <= 3) {
    rawScore = Math.max(88, rawScore);
  }

  // Clamp normalized score 0 - 100
  const priorityScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Categorize
  let priorityCategory = 'Low';
  if (priorityScore >= 90) priorityCategory = 'Critical';
  else if (priorityScore >= 70) priorityCategory = 'High';
  else if (priorityScore >= 40) priorityCategory = 'Medium';
  else priorityCategory = 'Low';

  // Generate explainable reason
  let reason = '';
  if (isOverdue) {
    const overdueHours = Math.abs(Math.round(hoursRemaining));
    reason = `OVERDUE by ${overdueHours}h! Immediate action required to prevent grade penalties.`;
  } else if (hoursRemaining <= 24) {
    reason = `Urgent deadline: Due within ${Math.round(hoursRemaining)} hours. Requires ${effort}h of focused effort.`;
  } else if (item.type === 'exam' && daysRemaining <= 2) {
    reason = `Upcoming Exam in ${daysRemaining} days. Requires ${effort}h of revision across high difficulty content.`;
  } else if (effortDeficit) {
    reason = `High crunch risk: Requires ${effort}h but only ${availableStudyHours}h available before deadline.`;
  } else if (importance >= 4 && difficulty >= 4) {
    reason = `High-stakes item (Importance: ${importance}/5, Difficulty: ${difficulty}/5). Start early to avoid bottleneck.`;
  } else if (daysRemaining <= 7) {
    reason = `Due this week (${daysRemaining} days remaining). Estimated effort: ${effort}h.`;
  } else {
    reason = `Comfortable timeline (${daysRemaining} days remaining). Low immediate pressure.`;
  }

  return {
    ...item,
    dueDate,
    daysRemaining,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    isOverdue,
    availableStudyHours,
    effortDeficit,
    priorityScore,
    priorityCategory,
    breakdown: {
      deadlineScore: Math.round(deadlineScore),
      importanceScore: Math.round(importanceScore),
      difficultyScore: Math.round(difficultyScore),
      effortRiskScore: Math.round(effortRiskScore),
      examBonus
    },
    reason
  };
};

/**
 * Generate 7-Day Study Schedule based on student availability and task priority
 * STRICT RULE: Never overbooks available study time for any day!
 * @param {Array} prioritizedItems
 * @param {object} weeklyHours
 * @returns {Array} Day-by-day scheduled blocks
 */
const generateStudySchedule = (prioritizedItems, weeklyHours = {}) => {
  const defaultHours = {
    monday: 2,
    tuesday: 2,
    wednesday: 2,
    thursday: 2,
    friday: 2,
    saturday: 4,
    sunday: 4,
    ...weeklyHours
  };

  const now = new Date();
  const scheduleDays = [];

  // Clone pending items with remaining effort
  const pendingWorkQueue = prioritizedItems
    .filter((item) => item.status !== 'Completed')
    .map((item) => ({
      id: item._id || item.id,
      title: item.title,
      subject: item.subject,
      type: item.type,
      priorityScore: item.priorityScore,
      priorityCategory: item.priorityCategory,
      dueDate: new Date(item.dueDate),
      totalEffort: item.type === 'exam' ? item.preparationHours : item.estimatedEffort,
      remainingEffort: item.type === 'exam' ? item.preparationHours : item.estimatedEffort
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Generate 7 upcoming days
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(now);
    currentDay.setDate(now.getDate() + i);
    currentDay.setHours(0, 0, 0, 0);

    const endOfCurrentDay = new Date(currentDay);
    endOfCurrentDay.setHours(23, 59, 59, 999);

    const dayName = DAYS_OF_WEEK[currentDay.getDay()];
    const dailyBudget = Math.max(0, Number(defaultHours[dayName]) || 0);

    let remainingDailyHours = dailyBudget;
    const daySessions = [];

    // Allocate queue to today's budget
    for (const task of pendingWorkQueue) {
      if (remainingDailyHours <= 0) break;
      if (task.remainingEffort <= 0) continue;

      // Check if task deadline has already passed before this day starts
      if (task.dueDate < currentDay) {
        // Can still work if overdue, but flag as overdue study
      }

      const allocatedHours = Math.min(remainingDailyHours, task.remainingEffort);
      const roundedAllocated = Math.round(allocatedHours * 10) / 10;

      if (roundedAllocated > 0) {
        daySessions.push({
          taskId: task.id,
          taskTitle: task.title,
          subject: task.subject,
          type: task.type,
          priorityCategory: task.priorityCategory,
          priorityScore: task.priorityScore,
          dueDate: task.dueDate,
          allocatedHours: roundedAllocated,
          isCompletedInThisSession: task.remainingEffort - roundedAllocated <= 0
        });

        task.remainingEffort = Math.max(0, Math.round((task.remainingEffort - roundedAllocated) * 10) / 10);
        remainingDailyHours = Math.max(0, Math.round((remainingDailyHours - roundedAllocated) * 10) / 10);
      }
    }

    const scheduledHours = Math.round((dailyBudget - remainingDailyHours) * 10) / 10;

    scheduleDays.push({
      date: currentDay.toISOString().split('T')[0],
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      availableHours: dailyBudget,
      scheduledHours,
      remainingAvailableHours: remainingDailyHours,
      utilizationPercentage: dailyBudget > 0 ? Math.round((scheduledHours / dailyBudget) * 100) : 0,
      sessions: daySessions
    });
  }

  // Unfinished items after 7 days
  const uncompletedQueue = pendingWorkQueue
    .filter((t) => t.remainingEffort > 0)
    .map((t) => ({
      title: t.title,
      subject: t.subject,
      unallocatedHours: t.remainingEffort,
      priorityCategory: t.priorityCategory
    }));

  return {
    schedule: scheduleDays,
    unallocatedTasks: uncompletedQueue,
    totalAvailableWeeklyHours: Object.values(defaultHours).reduce((a, b) => Number(a) + Number(b), 0),
    totalScheduledHours: scheduleDays.reduce((sum, d) => sum + d.scheduledHours, 0)
  };
};

module.exports = {
  calculateAvailableHoursBeforeDate,
  evaluatePriority,
  generateStudySchedule
};
