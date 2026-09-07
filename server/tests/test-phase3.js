const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const { connectDB, disconnectDB } = require('../src/config/db');
const app = require('../src/app');

// Helper to make local HTTP requests
function request(server, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path: encodeURI(path),
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

const runPhase3Tests = async () => {
  console.log('🧪 Starting Phase 3 Team, Project Updates & Dashboard Tests...\n');

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
    await connectDB();
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, resolve));
    const testPort = serverInstance.address().port;
    console.log(`[Test Server] Running on port ${testPort}\n`);

    const ts = Date.now();
    // 1. Create Users
    const ownerRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Dr. Sarah Lead',
      email: `sarah_${ts}@example.com`,
      password: 'Password123!',
      role: 'member',
      title: 'Principal Investigator',
      department: 'Computer Science'
    });
    const ownerToken = ownerRes.data.data.token;
    const ownerId = ownerRes.data.data.user.id;

    const dev1Res = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Kevin Dev',
      email: `kevin_${ts}@example.com`,
      password: 'Password123!',
      role: 'student',
      title: 'Graduate Researcher',
      department: 'Computer Science'
    });
    const dev1Token = dev1Res.data.data.token;
    const dev1Id = dev1Res.data.data.user.id;

    const dev2Res = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Maya Designer',
      email: `maya_${ts}@example.com`,
      password: 'Password123!',
      role: 'member',
      title: 'UI/UX Specialist',
      department: 'Design'
    });
    const dev2Id = dev2Res.data.data.user.id;

    // 2. Create Project
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const projRes = await request(serverInstance, 'POST', '/api/projects', {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'AI Dashboard & Monitoring',
      description: 'Centralized telemetry and progress monitoring',
      deadline,
      status: 'Active',
      priority: 'High',
      members: [dev1Id]
    });
    const projectId = projRes.data.data.project._id;

    // ----------------------------------------
    // A. TEAM MEMBER MANAGEMENT
    // ----------------------------------------
    console.log('1. Team Member Management:');

    // Add member Maya
    const addMemberRes = await request(serverInstance, 'POST', `/api/projects/${projectId}/members`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      userId: dev2Id
    });
    assert(addMemberRes.status === 200, 'POST /api/projects/:projectId/members adds member');
    assert(addMemberRes.data.data.members.some((m) => m._id === dev2Id), 'Maya is in project members list');

    // Duplicate addition prevention
    const dupAddRes = await request(serverInstance, 'POST', `/api/projects/${projectId}/members`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      userId: dev2Id
    });
    assert(dupAddRes.status === 400, 'Adding already-existing member is rejected with 400');

    // Unauthorized non-owner adding member
    const unauthAddRes = await request(serverInstance, 'POST', `/api/projects/${projectId}/members`, {
      Authorization: `Bearer ${dev1Token}`
    }, {
      userId: dev2Id
    });
    assert(unauthAddRes.status === 403, 'Non-owner member rejected when trying to add members (403)');

    // View project members with workload
    const viewMembersRes = await request(serverInstance, 'GET', `/api/projects/${projectId}/members`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(viewMembersRes.status === 200, 'GET /api/projects/:projectId/members returns 200');
    assert(Array.isArray(viewMembersRes.data.data.members), 'Returns array of project members');
    assert(viewMembersRes.data.data.members.length === 3, 'Project has 3 members (Sarah, Kevin, Maya)');
    assert(Boolean(viewMembersRes.data.data.members[0].workload), 'Each member has workload object');

    // Remove member Maya
    const removeMemberRes = await request(serverInstance, 'DELETE', `/api/projects/${projectId}/members/${dev2Id}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(removeMemberRes.status === 200, 'DELETE /api/projects/:projectId/members/:userId removes member');
    assert(!removeMemberRes.data.data.members.some((m) => m._id === dev2Id), 'Maya removed from members list');

    // Prevent removing owner
    const removeOwnerRes = await request(serverInstance, 'DELETE', `/api/projects/${projectId}/members/${ownerId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(removeOwnerRes.status === 400, 'Attempt to remove project owner rejected with 400');

    // Re-add Maya for subsequent workload tests
    await request(serverInstance, 'POST', `/api/projects/${projectId}/members`, {
      Authorization: `Bearer ${ownerToken}`
    }, { userId: dev2Id });

    // ----------------------------------------
    // B. PROJECT STATUS UPDATES (ACTIVITY FEED)
    // ----------------------------------------
    console.log('\n2. Project Status Updates & Activity Feed:');

    // Post update 1
    const postUpdate1 = await request(serverInstance, 'POST', `/api/projects/${projectId}/updates`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      text: 'Sprint 1 kickoff completed. Team aligned on core monitoring metrics.',
      status: 'Active',
      progress: 20
    });
    assert(postUpdate1.status === 201, 'POST /api/projects/:projectId/updates returns 201 Created');
    assert(postUpdate1.data.data.update.author.name === 'Dr. Sarah Lead', 'Author details populated in update');

    // Post update 2 by Kevin
    const postUpdate2 = await request(serverInstance, 'POST', `/api/projects/${projectId}/updates`, {
      Authorization: `Bearer ${dev1Token}`
    }, {
      text: 'Encountered dependency block in telemetry pipeline. Marking project At Risk.',
      status: 'At Risk',
      progress: 25
    });
    assert(postUpdate2.status === 201, 'Member Kevin can post project update');

    // Verify project status changed to At Risk via update
    const projCheck = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(projCheck.data.data.project.status === 'At Risk', 'Project status transitioned to At Risk');

    // Get updates timeline
    const getUpdatesRes = await request(serverInstance, 'GET', `/api/projects/${projectId}/updates`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(getUpdatesRes.status === 200, 'GET /api/projects/:projectId/updates returns 200');
    assert(getUpdatesRes.data.data.updates.length === 2, 'Timeline has 2 updates');
    assert(getUpdatesRes.data.data.updates[0].text.includes('Encountered dependency block'), 'Updates sorted chronologically descending');

    // ----------------------------------------
    // C. CREATE TASKS FOR DASHBOARD AGGREGATION
    // ----------------------------------------
    console.log('\n3. Creating Tasks for Dashboard Verification:');

    // Task 1: In Progress
    await request(serverInstance, 'POST', `/api/projects/${projectId}/tasks`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'Build Telemetry Engine',
      assignedTo: dev1Id,
      status: 'In Progress',
      progress: 40,
      estimatedEffort: 10,
      actualEffort: 3,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Task 2: Completed
    await request(serverInstance, 'POST', `/api/projects/${projectId}/tasks`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'Architect Data Models',
      assignedTo: dev1Id,
      status: 'Completed',
      progress: 100,
      estimatedEffort: 5,
      actualEffort: 4,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Task 3: Overdue Task
    await request(serverInstance, 'POST', `/api/projects/${projectId}/tasks`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'Submit Compliance Report',
      assignedTo: dev2Id,
      status: 'Todo',
      progress: 0,
      estimatedEffort: 3,
      actualEffort: 0,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // in the past
    });

    // ----------------------------------------
    // D. DASHBOARD SUMMARY ANALYTICS
    // ----------------------------------------
    console.log('\n4. Dashboard Summary Analytics:');
    const dashRes = await request(serverInstance, 'GET', '/api/dashboard/summary', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(dashRes.status === 200, 'GET /api/dashboard/summary returns 200 OK');
    assert(dashRes.data.success === true, 'Dashboard response success is true');

    const metrics = dashRes.data.data.metrics;
    assert(metrics.projects.total >= 1, 'Metrics includes total projects');
    assert(metrics.projects.atRisk >= 1, 'Metrics includes at-risk project count');
    assert(typeof metrics.projects.overallProgress === 'number', 'Metrics includes overallProgress number');

    assert(metrics.tasks.total === 3, 'Task count is 3');
    assert(metrics.tasks.completed === 1, 'Completed tasks count is 1');
    assert(metrics.tasks.inProgress === 1, 'In progress tasks count is 1');
    assert(metrics.tasks.pending === 2, 'Pending tasks count is 2');
    assert(metrics.tasks.overdue === 1, 'Overdue tasks count is 1');
    assert(metrics.tasks.totalEstimatedHours === 18, 'Total estimated effort aggregated correctly (5 + 10 + 3 = 18)');

    // Check Upcoming Deadlines feed
    const upcomingDeadlines = dashRes.data.data.upcomingDeadlines;
    assert(Array.isArray(upcomingDeadlines), 'Upcoming deadlines is an array');
    assert(upcomingDeadlines.length >= 2, 'Upcoming deadlines contains project and tasks');
    const overdueItem = upcomingDeadlines.find((d) => d.title === 'Submit Compliance Report');
    assert(overdueItem && overdueItem.isOverdue === true, 'Overdue task correctly flagged with isOverdue: true');

    // Check Recent Updates feed
    const recentUpdates = dashRes.data.data.recentUpdates;
    assert(Array.isArray(recentUpdates), 'Recent updates is an array');
    assert(recentUpdates.length === 2, 'Recent updates contains 2 posted updates');
    assert(Boolean(recentUpdates[0].author.name), 'Recent updates have populated author');

    // ----------------------------------------
    // E. ALL TEAM MEMBERS WORKLOAD DIRECTORY
    // ----------------------------------------
    console.log('\n5. Team Workload Directory:');
    const teamRes = await request(serverInstance, 'GET', '/api/team/members', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(teamRes.status === 200, 'GET /api/team/members returns 200 OK');
    assert(Array.isArray(teamRes.data.data.members), 'Returns array of workspace members');
    const kevinStats = teamRes.data.data.members.find((m) => m.user._id === dev1Id);
    assert(Boolean(kevinStats), 'Found Kevin in workspace members directory');
    assert(kevinStats.workload.totalTasks === 2, 'Kevin has 2 assigned tasks');
    assert(kevinStats.workload.completedTasks === 1, 'Kevin has 1 completed task');
    assert(kevinStats.workload.totalEstimatedEffort === 15, 'Kevin estimated hours calculated (5 + 10 = 15)');

    console.log(`\n=========================================`);
    console.log(`🎉 PHASE 3 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
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

runPhase3Tests();
