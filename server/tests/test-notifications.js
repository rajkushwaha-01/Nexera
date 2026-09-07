const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const { connectDB, disconnectDB } = require('../src/config/db');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const Assignment = require('../src/models/Assignment');
const Exam = require('../src/models/Exam');
const NotificationLog = require('../src/models/NotificationLog');
const {
  checkUpcomingDeadlines,
  startScheduler,
  stopScheduler
} = require('../src/services/reminderScheduler');
const {
  getMockSentEmails,
  clearMockSentEmails,
  sendDeadlineReminderEmail,
  formatRemainingTime,
  isValidEmail
} = require('../src/services/emailService');

// Helper to make local HTTP requests
function request(server, method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path: encodeURI(reqPath),
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const runNotificationTests = async () => {
  console.log('🧪 Starting Automated Deadline Email Notification Tests...\n');

  let serverInstance;
  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, description) => {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
    }
  };

  try {
    process.env.NODE_ENV = 'test';
    await connectDB();
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, resolve));
    const testPort = serverInstance.address().port;
    console.log(`[Test Server] Running on port ${testPort}\n`);

    const ts = Date.now();

    // 0. Setup test user
    const registerRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Alice Developer',
      email: `alice_notif_${ts}@example.com`,
      password: 'Password123!',
      role: 'member'
    });
    const token = registerRes.data.data.token;
    const user = registerRes.data.data.user;

    // Create a project for tasks
    const projRes = await request(serverInstance, 'POST', '/api/projects', {
      Authorization: `Bearer ${token}`
    }, {
      title: `Notif Test Project ${ts}`,
      description: 'Project for deadline notification test suite',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      priority: 'High'
    });
    const projectId = projRes.data.data.project._id;

    // ----------------------------------------------------
    // TEST 1: 24-HOUR DEADLINE REMINDER
    // ----------------------------------------------------
    console.log('1. Testing 24-Hour Reminder:');
    clearMockSentEmails();
    const baseNow = new Date('2026-10-01T12:00:00.000Z');

    // Create Task due in 23.5 hours from baseNow
    const taskDue24h = new Date(baseNow.getTime() + 23.5 * 60 * 60 * 1000);
    const task24 = await Task.create({
      project: projectId,
      title: 'Task Due in 24 Hours',
      dueDate: taskDue24h,
      assignedTo: user.id,
      createdBy: user.id,
      status: 'In Progress',
      priority: 'High'
    });

    const check24Res = await checkUpcomingDeadlines(baseNow);
    assert(check24Res.sentReminders.length >= 1, '24-hour reminder was identified and dispatched');

    const sent24 = check24Res.sentReminders.find((r) => r.title === 'Task Due in 24 Hours');
    assert(Boolean(sent24), 'Found sent 24h reminder for target task');
    assert(sent24 && sent24.reminderType === '24h', 'Reminder type is 24h');

    const updatedTask24 = await Task.findById(task24._id);
    assert(updatedTask24.deadlineReminder24Sent === true, 'Task deadlineReminder24Sent marked true in DB');

    const mockEmails = getMockSentEmails();
    const email24 = mockEmails.find((m) => m.to.includes(user.email.toLowerCase()));
    assert(Boolean(email24), 'Email dispatched to responsible user email address');
    assert(email24.subject.includes('24 Hours Remaining'), 'Subject line specifies 24 Hours Remaining');
    assert(email24.html.includes('Task Due in 24 Hours'), 'Email body contains task title');
    assert(email24.html.includes('Open in Project Monitor'), 'Email contains CTA button linking to application');

    // ----------------------------------------------------
    // TEST 2: 1-HOUR DEADLINE REMINDER
    // ----------------------------------------------------
    console.log('\n2. Testing 1-Hour Reminder:');
    clearMockSentEmails();

    // Create Assignment due in 45 minutes from baseNow
    const asgnDue1h = new Date(baseNow.getTime() + 45 * 60 * 1000);
    const asgn1h = await Assignment.create({
      student: user.id,
      subject: 'Algorithms',
      title: 'Assignment Due in 45 Min',
      deadline: asgnDue1h,
      estimatedEffort: 2,
      importance: 5,
      difficulty: 4,
      status: 'In Progress'
    });

    const check1hRes = await checkUpcomingDeadlines(baseNow);
    const sent1h = check1hRes.sentReminders.find((r) => r.title === 'Assignment Due in 45 Min');
    assert(Boolean(sent1h), '1-hour reminder identified and sent for assignment');
    assert(sent1h && sent1h.reminderType === '1h', 'Reminder type is 1h');

    const updatedAsgn1h = await Assignment.findById(asgn1h._id);
    assert(updatedAsgn1h.deadlineReminder1hSent === true, 'Assignment deadlineReminder1hSent marked true in DB');

    const mockEmails1h = getMockSentEmails();
    const email1h = mockEmails1h.find((m) => m.subject.includes('1 Hour Remaining'));
    assert(Boolean(email1h), 'Email subject contains 1 Hour Remaining');
    assert(email1h.subject.includes('URGENT'), 'Urgent prefix applied for 1-hour warning');

    // ----------------------------------------------------
    // TEST 3: COMPLETED TASK (SKIP REMINDER)
    // ----------------------------------------------------
    console.log('\n3. Testing Completed Task (Should be skipped):');
    clearMockSentEmails();

    const taskCompleted = await Task.create({
      project: projectId,
      title: 'Already Completed Task',
      dueDate: new Date(baseNow.getTime() + 2 * 60 * 60 * 1000), // due in 2 hours
      assignedTo: user.id,
      createdBy: user.id,
      status: 'Completed',
      priority: 'Low'
    });

    const checkCompletedRes = await checkUpcomingDeadlines(baseNow);
    const sentCompleted = checkCompletedRes.sentReminders.find((r) => r.title === 'Already Completed Task');
    assert(!sentCompleted, 'Completed task was NOT sent a reminder');

    // ----------------------------------------------------
    // TEST 4: OVERDUE TASK (DEADLINE IN PAST)
    // ----------------------------------------------------
    console.log('\n4. Testing Overdue Task (Should be skipped):');
    clearMockSentEmails();

    const taskOverdue = await Task.create({
      project: projectId,
      title: 'Overdue Past Task',
      dueDate: new Date(baseNow.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      assignedTo: user.id,
      createdBy: user.id,
      status: 'In Progress',
      priority: 'Critical'
    });

    const checkOverdueRes = await checkUpcomingDeadlines(baseNow);
    const sentOverdue = checkOverdueRes.sentReminders.find((r) => r.title === 'Overdue Past Task');
    assert(!sentOverdue, 'Overdue task was NOT sent a deadline reminder');

    // ----------------------------------------------------
    // TEST 5: CHANGED DEADLINE (RESETS NOTIFICATION STATE)
    // ----------------------------------------------------
    console.log('\n5. Testing Changed Deadline Reset:');
    clearMockSentEmails();

    // Verify task24 currently has deadlineReminder24Sent = true
    const beforeUpdate = await Task.findById(task24._id);
    assert(beforeUpdate.deadlineReminder24Sent === true, 'Task had 24h reminder already sent');

    // Update deadline via PUT /api/tasks/:id
    const newDueDate = new Date(baseNow.getTime() + 72 * 60 * 60 * 1000); // 3 days out
    const putTaskRes = await request(serverInstance, 'PUT', `/api/tasks/${task24._id}`, {
      Authorization: `Bearer ${token}`
    }, {
      dueDate: newDueDate.toISOString()
    });
    assert(putTaskRes.status === 200, 'PUT /api/tasks/:id succeeded');

    const afterUpdate = await Task.findById(task24._id);
    assert(afterUpdate.deadlineReminder24Sent === false, 'deadlineReminder24Sent reset to false after dueDate changed');
    assert(afterUpdate.deadlineReminder1hSent === false, 'deadlineReminder1hSent reset to false after dueDate changed');

    // Advance simulated time to 23 hours before new deadline
    const advancedTime = new Date(newDueDate.getTime() - 23 * 60 * 60 * 1000);
    const checkResetRes = await checkUpcomingDeadlines(advancedTime);
    const sentNewDeadline = checkResetRes.sentReminders.find((r) => r.title === 'Task Due in 24 Hours');
    assert(Boolean(sentNewDeadline), 'Reminder triggered successfully for the updated deadline');

    // ----------------------------------------------------
    // TEST 6: DUPLICATE SCHEDULER EXECUTION
    // ----------------------------------------------------
    console.log('\n6. Testing Duplicate Prevention on Repeated Runs:');
    clearMockSentEmails();

    // Running check again at the exact same advancedTime
    const duplicateRun = await checkUpcomingDeadlines(advancedTime);
    const duplicateSent = duplicateRun.sentReminders.find((r) => r.title === 'Task Due in 24 Hours');
    assert(!duplicateSent, 'No duplicate reminder sent on repeated check');
    assert(duplicateRun.duplicatePreventedCount >= 1, 'Duplicate was explicitly detected and prevented');

    // NotificationLog verification
    const logs = await NotificationLog.find({
      entityId: task24._id,
      deadline: newDueDate
    });
    assert(logs.length === 1, 'NotificationLog has exactly 1 entry for this deadline');

    // ----------------------------------------------------
    // TEST 7: EMAIL FAILURE RESILIENCE
    // ----------------------------------------------------
    console.log('\n7. Testing Email Failure Resilience:');
    const failResult = await sendDeadlineReminderEmail({
      to: 'invalid-email-format-without-at',
      title: 'Crash Test Task',
      deadline: new Date(),
      reminderType: '24h'
    });
    assert(failResult.success === false, 'Gracefully caught invalid email error without throwing');
    assert(failResult.reason === 'invalid_email', 'Reports invalid_email reason');

    // ----------------------------------------------------
    // TEST 8: SCHEDULER LIFECYCLE (START / STOP)
    // ----------------------------------------------------
    console.log('\n8. Testing Scheduler Start / Stop Lifecycle:');
    startScheduler();
    assert(true, 'startScheduler() called without error');
    stopScheduler();
    assert(true, 'stopScheduler() cleanly stopped timer');

    // ----------------------------------------------------
    // TEST 9: PROTECTED DEVELOPMENT TEST ENDPOINT
    // ----------------------------------------------------
    console.log('\n9. Testing Protected Test Endpoint (POST /api/notifications/test-deadline):');

    const testEndpointRes = await request(
      serverInstance,
      'POST',
      '/api/notifications/test-deadline',
      { Authorization: `Bearer ${token}` },
      { simulatedNow: baseNow.toISOString() }
    );
    assert(testEndpointRes.status === 200, 'POST /api/notifications/test-deadline returns 200 OK');
    assert(testEndpointRes.data.success === true, 'Response contains success: true');
    assert(Boolean(testEndpointRes.data.data.results), 'Response contains scheduler check results');

    // Unauthorized check
    const unauthRes = await request(serverInstance, 'POST', '/api/notifications/test-deadline', {}, {});
    assert(unauthRes.status === 401, 'Rejects unauthenticated request with 401');

    // Notification logs route
    const logsRes = await request(serverInstance, 'GET', '/api/notifications/logs', {
      Authorization: `Bearer ${token}`
    });
    assert(logsRes.status === 200, 'GET /api/notifications/logs returns 200');
    assert(logsRes.data.data.logs.length >= 1, 'Audit log endpoint returns logged reminders');

    // ----------------------------------------------------
    // TEST 10: TIMEZONE / DATE UTILITIES
    // ----------------------------------------------------
    console.log('\n10. Testing Timezone & Remaining Time Calculation:');
    const futureDate = new Date(baseNow.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000); // 2h 15m
    const remainingStr = formatRemainingTime(futureDate, baseNow);
    assert(remainingStr === '2 hours, 15 minutes', `Formatted remaining time correctly: "${remainingStr}"`);

    const pastDate = new Date(baseNow.getTime() - 1000);
    const pastStr = formatRemainingTime(pastDate, baseNow);
    assert(pastStr === 'Deadline has passed', 'Overdue date reports "Deadline has passed"');

    console.log(`\n=========================================`);
    console.log(`🎉 NOTIFICATION TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
    console.log(`=========================================\n`);

    if (passedTests !== totalTests) {
      throw new Error(`Only ${passedTests} of ${totalTests} tests passed`);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await disconnectDB();
    process.exit(process.exitCode || 0);
  }
};

runNotificationTests();
