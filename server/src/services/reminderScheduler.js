const Task = require('../models/Task');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const Project = require('../models/Project');
const NotificationLog = require('../models/NotificationLog');
const { sendDeadlineReminderEmail } = require('./emailService');

let schedulerTimer = null;
let isChecking = false;

// 1 Hour in milliseconds
const ONE_HOUR_MS = 60 * 60 * 1000;
// 24 Hours in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Process a single deadline item for reminders
 */
const processItemDeadline = async (item, entityType, referenceTime) => {
  const deadline = item.deadlineDate;
  if (!deadline) return null;

  const deadlineMs = new Date(deadline).getTime();
  const refMs = new Date(referenceTime).getTime();
  const diffMs = deadlineMs - refMs;

  // Edge Case 1: Deadline already passed
  if (diffMs <= 0) {
    console.log(`[EMAIL] Reminder skipped: Deadline already passed for ${entityType} "${item.title}"`);
    return { status: 'skipped_passed' };
  }

  // Edge Case 2: Completed item
  if (item.status === 'Completed') {
    console.log(`[EMAIL] Reminder skipped: ${entityType} "${item.title}" is marked as Completed`);
    return { status: 'skipped_completed' };
  }

  let reminderType = null;

  if (diffMs <= ONE_HOUR_MS) {
    reminderType = '1h';
  } else if (diffMs <= TWENTY_FOUR_HOURS_MS) {
    reminderType = '24h';
  } else {
    // Farther than 24 hours away
    return { status: 'not_due' };
  }

  const modelClass = item.modelClass;
  const doc = item.rawDoc;

  // Check if this reminder was already marked on the document
  const alreadySentOnDoc =
    reminderType === '1h' ? doc.deadlineReminder1hSent : doc.deadlineReminder24Sent;

  if (alreadySentOnDoc && doc.lastNotifiedDeadline && new Date(doc.lastNotifiedDeadline).getTime() === deadlineMs) {
    console.log(`[EMAIL] Duplicate reminder prevented: ${reminderType} reminder already sent for ${entityType} "${item.title}"`);
    return { status: 'duplicate_prevented' };
  }

  // Check in NotificationLog database collection for absolute race condition safety
  const existingLog = await NotificationLog.findOne({
    entityType,
    entityId: doc._id,
    reminderType,
    deadline
  });

  if (existingLog) {
    console.log(`[EMAIL] Duplicate reminder prevented: ${reminderType} log found in database for ${entityType} "${item.title}"`);
    // Ensure doc flags stay in sync
    const flagUpdate = reminderType === '1h' ? { deadlineReminder1hSent: true } : { deadlineReminder24Sent: true };
    await modelClass.findByIdAndUpdate(doc._id, { $set: flagUpdate });
    return { status: 'duplicate_prevented' };
  }

  // Validate recipient
  if (!item.recipientEmail) {
    console.warn(`[EMAIL] Reminder skipped: No valid recipient email found for ${entityType} "${item.title}"`);
    return { status: 'skipped_no_recipient' };
  }

  // Attempt atomic insertion into NotificationLog to guarantee only 1 execution
  let logRecord;
  try {
    logRecord = await NotificationLog.create({
      entityType,
      entityId: doc._id,
      recipient: item.recipientId || null,
      recipientEmail: item.recipientEmail,
      reminderType,
      deadline,
      status: 'sent'
    });
  } catch (err) {
    // Unique index conflict (E11000) indicates concurrent execution already took this item
    if (err.code === 11000) {
      console.log(`[EMAIL] Duplicate reminder prevented: Concurrent duplicate blocked by unique index for ${entityType} "${item.title}"`);
      return { status: 'duplicate_prevented' };
    }
    console.error(`[EMAIL] Failed to write notification log for ${entityType} "${item.title}": ${err.message}`);
    return { status: 'failed_log' };
  }

  // Send the email
  const sendResult = await sendDeadlineReminderEmail({
    to: item.recipientEmail,
    recipientName: item.recipientName,
    entityType,
    title: item.title,
    projectOrSubject: item.projectOrSubject,
    deadline,
    reminderType,
    priority: item.priority || 'Medium',
    status: item.status || 'In Progress',
    referenceTime
  });

  if (!sendResult.success) {
    // Record error in log
    await NotificationLog.findByIdAndUpdate(logRecord._id, {
      $set: { status: 'failed', error: sendResult.error || sendResult.reason }
    });
    return { status: 'failed_send', error: sendResult.error || sendResult.reason };
  }

  // Mark document flags
  const updateData = {
    lastNotifiedDeadline: deadline
  };
  if (reminderType === '1h') {
    updateData.deadlineReminder1hSent = true;
    updateData.deadlineReminder24Sent = true; // 24h is moot if 1h has fired
  } else {
    updateData.deadlineReminder24Sent = true;
  }

  await modelClass.findByIdAndUpdate(doc._id, { $set: updateData });

  return { status: 'sent', reminderType, entityType, title: item.title, recipient: item.recipientEmail };
};

/**
 * Scan database for all upcoming deadlines across Tasks, Assignments, Exams, and Projects
 * @param {Date} [referenceTime=new Date()] Optional reference time to simulate clock for testing
 */
const checkUpcomingDeadlines = async (referenceTime = new Date()) => {
  if (isChecking) {
    console.log('[EMAIL] Reminder check already in progress, skipping concurrent run.');
    return { skipped: true, reason: 'concurrency_lock' };
  }

  isChecking = true;
  const results = {
    checkedCount: 0,
    sentReminders: [],
    skippedCount: 0,
    duplicatePreventedCount: 0,
    errors: []
  };

  try {
    const refDate = new Date(referenceTime);
    const maxWindow = new Date(refDate.getTime() + TWENTY_FOUR_HOURS_MS + 60 * 1000); // +1m buffer

    // 1. Fetch upcoming Tasks
    const upcomingTasks = await Task.find({
      status: { $ne: 'Completed' },
      dueDate: { $ne: null, $gt: refDate, $lte: maxWindow }
    })
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // 2. Fetch upcoming Assignments
    const upcomingAssignments = await Assignment.find({
      status: { $ne: 'Completed' },
      deadline: { $ne: null, $gt: refDate, $lte: maxWindow }
    }).populate('student', 'name email');

    // 3. Fetch upcoming Exams
    const upcomingExams = await Exam.find({
      status: { $ne: 'Completed' },
      examDate: { $ne: null, $gt: refDate, $lte: maxWindow }
    }).populate('student', 'name email');

    // 4. Fetch upcoming Projects
    const upcomingProjects = await Project.find({
      status: { $ne: 'Completed' },
      isArchived: false,
      deadline: { $ne: null, $gt: refDate, $lte: maxWindow }
    }).populate('owner', 'name email');

    // Prepare unified queue
    const itemsToProcess = [];

    upcomingTasks.forEach((t) => {
      const recipientUser = t.assignedTo || t.createdBy;
      itemsToProcess.push({
        entityType: 'Task',
        title: t.title,
        deadlineDate: t.dueDate,
        projectOrSubject: t.project ? t.project.title : 'General Task',
        recipientName: recipientUser ? recipientUser.name : 'Team Member',
        recipientEmail: recipientUser ? recipientUser.email : null,
        recipientId: recipientUser ? recipientUser._id : null,
        priority: t.priority,
        status: t.status,
        modelClass: Task,
        rawDoc: t
      });
    });

    upcomingAssignments.forEach((a) => {
      itemsToProcess.push({
        entityType: 'Assignment',
        title: a.title,
        deadlineDate: a.deadline,
        projectOrSubject: a.subject || 'Academic Course',
        recipientName: a.student ? a.student.name : 'Student',
        recipientEmail: a.student ? a.student.email : null,
        recipientId: a.student ? a.student._id : null,
        priority: a.importance >= 4 ? 'High' : 'Medium',
        status: a.status,
        modelClass: Assignment,
        rawDoc: a
      });
    });

    upcomingExams.forEach((e) => {
      itemsToProcess.push({
        entityType: 'Exam',
        title: e.title,
        deadlineDate: e.examDate,
        projectOrSubject: e.subject || 'Academic Examination',
        recipientName: e.student ? e.student.name : 'Student',
        recipientEmail: e.student ? e.student.email : null,
        recipientId: e.student ? e.student._id : null,
        priority: e.importance >= 4 ? 'Critical' : 'High',
        status: e.status,
        modelClass: Exam,
        rawDoc: e
      });
    });

    upcomingProjects.forEach((p) => {
      itemsToProcess.push({
        entityType: 'Project',
        title: p.title,
        deadlineDate: p.deadline,
        projectOrSubject: p.title,
        recipientName: p.owner ? p.owner.name : 'Project Owner',
        recipientEmail: p.owner ? p.owner.email : null,
        recipientId: p.owner ? p.owner._id : null,
        priority: p.priority,
        status: p.status,
        modelClass: Project,
        rawDoc: p
      });
    });

    results.checkedCount = itemsToProcess.length;

    for (const item of itemsToProcess) {
      try {
        const processResult = await processItemDeadline(item, item.entityType, refDate);
        if (processResult) {
          if (processResult.status === 'sent') {
            results.sentReminders.push(processResult);
          } else if (processResult.status === 'duplicate_prevented') {
            results.duplicatePreventedCount++;
          } else if (processResult.status && processResult.status.startsWith('skipped')) {
            results.skippedCount++;
          }
        }
      } catch (err) {
        console.error(`[EMAIL] Error processing item ${item.title}:`, err.message);
        results.errors.push({ title: item.title, error: err.message });
      }
    }
  } catch (err) {
    console.error('[EMAIL] Scheduler error querying MongoDB:', err.message);
    results.errors.push({ global: err.message });
  } finally {
    isChecking = false;
  }

  return results;
};

/**
 * Start the recurring background scheduler
 */
const startScheduler = () => {
  if (schedulerTimer) {
    return;
  }

  const intervalMs = Number(process.env.DEADLINE_CHECK_INTERVAL_MS) || 60000;
  console.log(`[Scheduler] Deadline reminder scheduler activated (interval: ${intervalMs}ms)`);

  // Initial check on startup
  checkUpcomingDeadlines().catch((err) => {
    console.error('[Scheduler] Initial run error:', err.message);
  });

  // Recurring background checker
  schedulerTimer = setInterval(() => {
    checkUpcomingDeadlines().catch((err) => {
      console.error('[Scheduler] Periodic check error:', err.message);
    });
  }, intervalMs);

  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }
};

/**
 * Stop the scheduler cleanly
 */
const stopScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[Scheduler] Deadline reminder scheduler stopped.');
  }
};

module.exports = {
  checkUpcomingDeadlines,
  processItemDeadline,
  startScheduler,
  stopScheduler
};
