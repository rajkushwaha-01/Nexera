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

const runProjectTaskTests = async () => {
  console.log('🧪 Starting Phase 2 Project & Task Management Tests...\n');

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

    // Setup Test Users: Owner, Team Member, and Third-party Non-member
    const ts = Date.now();
    const ownerRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Owner Alice',
      email: `alice_${ts}@example.com`,
      password: 'Password123!',
      role: 'student'
    });
    const ownerToken = ownerRes.data.data.token;
    const ownerId = ownerRes.data.data.user.id;

    const memberRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Member Bob',
      email: `bob_${ts}@example.com`,
      password: 'Password123!',
      role: 'member'
    });
    const memberToken = memberRes.data.data.token;
    const memberId = memberRes.data.data.user.id;

    const outsiderRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Outsider Charlie',
      email: `charlie_${ts}@example.com`,
      password: 'Password123!',
      role: 'student'
    });
    const outsiderToken = outsiderRes.data.data.token;

    console.log('1. Project Creation Validation:');
    const badProj = await request(serverInstance, 'POST', '/api/projects', {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'A'
    });
    assert(badProj.status === 400, 'Rejects project missing deadline and short title');
    assert(badProj.data.success === false, 'Error response has success: false');

    console.log('\n2. Successful Project Creation:');
    const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const createProjRes = await request(serverInstance, 'POST', '/api/projects', {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'Hackathon Project Monitoring Platform',
      description: 'Building an integrated monitoring tool for teams and students',
      deadline: futureDeadline,
      status: 'Active',
      priority: 'High',
      members: [memberId]
    });
    assert(createProjRes.status === 201, 'POST /api/projects returns 201 Created');
    assert(createProjRes.data.success === true, 'Project created successfully');
    const projectId = createProjRes.data.data.project._id;
    assert(Boolean(projectId), 'Project has generated ObjectId');
    assert(createProjRes.data.data.project.owner._id === ownerId, 'Project owner set to Alice');
    assert(createProjRes.data.data.project.members.length === 2, 'Project has both Alice and Bob as members');

    console.log('\n3. Project Listing & Filtering:');
    const listRes = await request(serverInstance, 'GET', '/api/projects?page=1&limit=5', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(listRes.status === 200, 'GET /api/projects returns 200 OK');
    assert(listRes.data.data.projects.length >= 1, 'Projects list contains created project');
    assert(listRes.data.meta.page === 1, 'Meta contains pagination page info');

    // Filter by status
    const filterStatusRes = await request(serverInstance, 'GET', '/api/projects?status=Active', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(filterStatusRes.status === 200, 'GET /api/projects?status=Active returns 200');
    assert(filterStatusRes.data.data.projects.every((p) => p.status === 'Active'), 'All filtered projects have status Active');

    // Search by title
    const searchRes = await request(serverInstance, 'GET', '/api/projects?search=Hackathon', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(searchRes.data.data.projects.length >= 1, 'Search by title finds matching project');

    // Deadline filter
    const deadlineRes = await request(serverInstance, 'GET', '/api/projects?deadline=upcoming', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(deadlineRes.data.data.projects.length >= 1, 'Deadline filter returns upcoming project');

    console.log('\n4. Project Details & Authorization:');
    const getProjRes = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${memberToken}`
    });
    assert(getProjRes.status === 200, 'Project member Bob can view project details');
    assert(Array.isArray(getProjRes.data.data.tasks), 'Project details include tasks array');

    const unauthorizedViewRes = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${outsiderToken}`
    });
    assert(unauthorizedViewRes.status === 403, 'Non-member Charlie rejected with 403 Forbidden');

    console.log('\n5. Project Update:');
    const updateProjRes = await request(serverInstance, 'PUT', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      description: 'Updated hackathon monitoring description with enhanced specs',
      priority: 'Critical'
    });
    assert(updateProjRes.status === 200, 'Owner can update project details');
    assert(updateProjRes.data.data.project.priority === 'Critical', 'Project priority updated to Critical');

    const unauthorizedUpdateRes = await request(serverInstance, 'PUT', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${memberToken}`
    }, {
      priority: 'Low'
    });
    assert(unauthorizedUpdateRes.status === 403, 'Member Bob cannot update project configuration');

    console.log('\n6. Task Creation & Project Progress Synchronization:');
    const taskDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const task1Res = await request(serverInstance, 'POST', `/api/projects/${projectId}/tasks`, {
      Authorization: `Bearer ${ownerToken}`
    }, {
      title: 'Design Database Schemas',
      description: 'Define schemas for project, task, and user',
      assignedTo: memberId,
      priority: 'High',
      status: 'In Progress',
      dueDate: taskDue,
      estimatedEffort: 4,
      actualEffort: 2,
      progress: 50
    });
    assert(task1Res.status === 201, 'POST /api/projects/:projectId/tasks returns 201 Created');
    const task1Id = task1Res.data.data.task._id;
    assert(Boolean(task1Id), 'Task 1 has generated ObjectId');
    assert(task1Res.data.data.task.assignedTo._id === memberId, 'Task 1 assigned to Bob');

    // Create Task 2
    const task2Res = await request(serverInstance, 'POST', `/api/projects/${projectId}/tasks`, {
      Authorization: `Bearer ${memberToken}`
    }, {
      title: 'Implement REST APIs',
      description: 'Implement controllers and routes',
      assignedTo: memberId,
      priority: 'High',
      status: 'Todo',
      dueDate: taskDue,
      estimatedEffort: 6,
      progress: 0
    });
    assert(task2Res.status === 201, 'Member Bob can create Task 2 in project');
    const task2Id = task2Res.data.data.task._id;

    // Check synchronized project progress: (50 + 0) / 2 = 25%
    const projProgressCheck = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(projProgressCheck.data.data.project.progress === 25, 'Project progress automatically synchronized to 25%');

    console.log('\n7. Task Listing & Filtering:');
    const tasksListRes = await request(serverInstance, 'GET', `/api/projects/${projectId}/tasks?status=In Progress`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(tasksListRes.status === 200, 'GET /api/projects/:projectId/tasks returns 200');
    assert(tasksListRes.data.data.tasks.length === 1, 'Filtered tasks count is 1 for status=In Progress');
    assert(tasksListRes.data.data.tasks[0]._id === task1Id, 'Filtered task is Task 1');

    console.log('\n8. Task Retrieval & Update:');
    const getTaskRes = await request(serverInstance, 'GET', `/api/tasks/${task1Id}`, {
      Authorization: `Bearer ${memberToken}`
    });
    assert(getTaskRes.status === 200, 'GET /api/tasks/:id returns 200');
    assert(getTaskRes.data.data.task.title === 'Design Database Schemas', 'Retrieved task has correct title');

    // Update Task 1 to Completed (progress auto-updates to 100)
    const updateTask1Res = await request(serverInstance, 'PUT', `/api/tasks/${task1Id}`, {
      Authorization: `Bearer ${memberToken}`
    }, {
      status: 'Completed',
      actualEffort: 4
    });
    assert(updateTask1Res.status === 200, 'PUT /api/tasks/:id returns 200');
    assert(updateTask1Res.data.data.task.progress === 100, 'Marking status Completed auto-sets progress to 100');

    // Update Task 2 to Completed
    await request(serverInstance, 'PUT', `/api/tasks/${task2Id}`, {
      Authorization: `Bearer ${memberToken}`
    }, {
      status: 'Completed',
      progress: 100,
      actualEffort: 5
    });

    // Both tasks completed: Project progress should now be 100% and project status should be Completed
    const projCompletedCheck = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(projCompletedCheck.data.data.project.progress === 100, 'Project progress auto-synchronized to 100%');
    assert(projCompletedCheck.data.data.project.status === 'Completed', 'Project status automatically marked Completed');

    console.log('\n9. Task Deletion:');
    const delTask2Res = await request(serverInstance, 'DELETE', `/api/tasks/${task2Id}`, {
      Authorization: `Bearer ${memberToken}`
    });
    assert(delTask2Res.status === 200, 'DELETE /api/tasks/:id returns 200');

    console.log('\n10. Project Deletion & Cascade Task Deletion:');
    const delProjRes = await request(serverInstance, 'DELETE', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(delProjRes.status === 200, 'DELETE /api/projects/:id returns 200');

    // Verify project deleted
    const checkDeletedProj = await request(serverInstance, 'GET', `/api/projects/${projectId}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(checkDeletedProj.status === 404, 'Deleted project returns 404');

    // Verify cascade deleted task
    const checkDeletedTask = await request(serverInstance, 'GET', `/api/tasks/${task1Id}`, {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(checkDeletedTask.status === 404, 'Associated task cascade-deleted and returns 404');

    console.log(`\n=========================================`);
    console.log(`🎉 PHASE 2 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
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

runProjectTaskTests();
