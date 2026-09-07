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

const runPhase4Tests = async () => {
  console.log('🧪 Starting Phase 4 Student Planner & Prioritization Engine Tests...\n');

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
    // 1. Create a Student User with defined study hours
    const studentRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Jordan Student',
      email: `jordan_${ts}@example.com`,
      password: 'Password123!',
      role: 'student',
      weeklyStudyHours: {
        monday: 2,
        tuesday: 3,
        wednesday: 1,
        thursday: 2,
        friday: 2,
        saturday: 4,
        sunday: 4
      }
    });
    const token = studentRes.data.data.token;
    const studentId = studentRes.data.data.user.id;

    // ----------------------------------------------------
    // A. STUDY AVAILABILITY CRUD
    // ----------------------------------------------------
    console.log('1. Study Availability Management:');
    const getAvailRes = await request(serverInstance, 'GET', '/api/planner/availability', {
      Authorization: `Bearer ${token}`
    });
    assert(getAvailRes.status === 200, 'GET /api/planner/availability returns 200');
    assert(getAvailRes.data.data.weeklyStudyHours.monday === 2, 'Monday study availability is 2 hours');

    const updateAvailRes = await request(serverInstance, 'PUT', '/api/planner/availability', {
      Authorization: `Bearer ${token}`
    }, {
      weeklyStudyHours: {
        monday: 3,
        tuesday: 3,
        wednesday: 2,
        thursday: 2,
        friday: 3,
        saturday: 5,
        sunday: 5
      }
    });
    assert(updateAvailRes.status === 200, 'PUT /api/planner/availability updates study hours');
    assert(updateAvailRes.data.data.weeklyStudyHours.monday === 3, 'Monday study hours updated to 3');

    // ----------------------------------------------------
    // B. ASSIGNMENTS CRUD
    // ----------------------------------------------------
    console.log('\n2. Assignments CRUD:');
    const assignmentBad = await request(serverInstance, 'POST', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    }, {
      title: 'A'
    });
    assert(assignmentBad.status === 400, 'Rejects invalid assignment creation (missing fields)');

    // Create Assignment 1 (Standard)
    const asgn1Date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const asgn1Res = await request(serverInstance, 'POST', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'Algorithms',
      title: 'Graph Traversal Implementation',
      description: 'Implement Dijkstra and A* algorithms',
      deadline: asgn1Date,
      estimatedEffort: 4,
      importance: 4,
      difficulty: 3
    });
    assert(asgn1Res.status === 201, 'POST /api/planner/assignments returns 201 Created');
    const asgn1Id = asgn1Res.data.data.assignment._id;
    assert(Boolean(asgn1Id), 'Assignment has valid ID');

    // Get Assignments list
    const getAsgnsRes = await request(serverInstance, 'GET', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    });
    assert(getAsgnsRes.status === 200, 'GET /api/planner/assignments returns 200');
    assert(getAsgnsRes.data.data.assignments.length === 1, 'Assignments list contains created item');

    // Update Assignment 1
    const updateAsgnRes = await request(serverInstance, 'PUT', `/api/planner/assignments/${asgn1Id}`, {
      Authorization: `Bearer ${token}`
    }, {
      status: 'In Progress',
      estimatedEffort: 3.5
    });
    assert(updateAsgnRes.status === 200, 'PUT /api/planner/assignments/:id updates assignment');
    assert(updateAsgnRes.data.data.assignment.status === 'In Progress', 'Status updated to In Progress');

    // ----------------------------------------------------
    // C. EXAMS CRUD
    // ----------------------------------------------------
    console.log('\n3. Exams CRUD:');
    const examBad = await request(serverInstance, 'POST', '/api/planner/exams', {
      Authorization: `Bearer ${token}`
    }, {
      title: 'Short'
    });
    assert(examBad.status === 400, 'Rejects invalid exam creation (missing fields)');

    const exam1Date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const exam1Res = await request(serverInstance, 'POST', '/api/planner/exams', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'Data Structures',
      title: 'Midterm Examination',
      examDate: exam1Date,
      importance: 5,
      difficulty: 4,
      preparationHours: 12
    });
    assert(exam1Res.status === 201, 'POST /api/planner/exams returns 201 Created');
    const exam1Id = exam1Res.data.data.exam._id;
    assert(Boolean(exam1Id), 'Exam has valid ID');

    const getExamsRes = await request(serverInstance, 'GET', '/api/planner/exams', {
      Authorization: `Bearer ${token}`
    });
    assert(getExamsRes.status === 200, 'GET /api/planner/exams returns 200');
    assert(getExamsRes.data.data.exams.length === 1, 'Exams list contains created item');

    // ----------------------------------------------------
    // D. PRIORITIZATION ENGINE EDGE CASES
    // ----------------------------------------------------
    console.log('\n4. Prioritization Engine Edge Cases:');

    // Edge Case 1: Overdue Assignment (Deadline in the past)
    const overdueDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const overdueRes = await request(serverInstance, 'POST', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'History',
      title: 'Term Paper Submission',
      deadline: overdueDeadline,
      estimatedEffort: 3,
      importance: 5,
      difficulty: 3
    });
    assert(overdueRes.status === 201, 'Created overdue assignment for edge testing');

    // Edge Case 2: Exam Tomorrow (Urgent Exam)
    const examTomorrowDate = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(); // ~20 hours from now
    const examTomorrowRes = await request(serverInstance, 'POST', '/api/planner/exams', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'Physics',
      title: 'Quantum Mechanics Quiz',
      examDate: examTomorrowDate,
      importance: 4,
      difficulty: 5,
      preparationHours: 6
    });
    assert(examTomorrowRes.status === 201, 'Created exam tomorrow for edge testing');

    // Edge Case 3: High Importance with Distant Deadline (e.g. 25 days away)
    const distantDeadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    const distantRes = await request(serverInstance, 'POST', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'Capstone',
      title: 'Senior Thesis Draft',
      deadline: distantDeadline,
      estimatedEffort: 15,
      importance: 5,
      difficulty: 5
    });
    assert(distantRes.status === 201, 'Created distant high importance assignment for edge testing');

    // Edge Case 4: Large Assignment with Little Available Study Time (High Crunch Risk)
    // Deadline in 2 days, requiring 14 hours when daily available hours is 3
    const crunchDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const crunchRes = await request(serverInstance, 'POST', '/api/planner/assignments', {
      Authorization: `Bearer ${token}`
    }, {
      subject: 'Operating Systems',
      title: 'Kernel Driver Project',
      deadline: crunchDeadline,
      estimatedEffort: 14,
      importance: 4,
      difficulty: 4
    });
    assert(crunchRes.status === 201, 'Created large assignment with study time crunch for edge testing');

    // ----------------------------------------------------
    // E. INTELLIGENT PRIORITIES API
    // ----------------------------------------------------
    console.log('\n5. Intelligent Priorities Endpoint:');
    const prioritiesRes = await request(serverInstance, 'GET', '/api/planner/priorities', {
      Authorization: `Bearer ${token}`
    });
    assert(prioritiesRes.status === 200, 'GET /api/planner/priorities returns 200 OK');
    assert(prioritiesRes.data.success === true, 'Success flag is true');

    const items = prioritiesRes.data.data.items;
    assert(items.length === 6, 'All 6 created planner items ranked');

    // Verify ordering: highest score first
    const isSortedDesc = items.every((val, idx, arr) => idx === 0 || arr[idx - 1].priorityScore >= val.priorityScore);
    assert(isSortedDesc, 'Items strictly ordered by priorityScore descending');

    // Overdue item must be classified as Critical (90-100)
    const overdueItem = items.find((i) => i.title === 'Term Paper Submission');
    assert(overdueItem && overdueItem.isOverdue === true, 'Identified overdue item');
    assert(overdueItem.priorityScore >= 95, 'Overdue assignment receives critical score >= 95');
    assert(overdueItem.priorityCategory === 'Critical', 'Overdue assignment categorized as Critical');

    // Exam tomorrow must be classified as Critical
    const examTomItem = items.find((i) => i.title === 'Quantum Mechanics Quiz');
    assert(examTomItem.priorityScore >= 90, 'Exam tomorrow receives score >= 90');
    assert(examTomItem.priorityCategory === 'Critical', 'Exam tomorrow categorized as Critical');

    // Crunch risk assignment receives High or Critical
    const crunchItem = items.find((i) => i.title === 'Kernel Driver Project');
    assert(crunchItem.effortDeficit === true, 'Kernel Driver correctly flagged with effortDeficit: true');
    assert(crunchItem.priorityScore >= 70, 'Study time crunch item receives at least High priority');

    // Distant thesis receives lower score than urgent items
    const distantItem = items.find((i) => i.title === 'Senior Thesis Draft');
    assert(distantItem.priorityScore < overdueItem.priorityScore, 'Distant thesis has lower priority than overdue item');
    assert(distantItem.priorityCategory === 'Medium' || distantItem.priorityCategory === 'Low', 'Distant thesis categorized Medium or Low');

    // Intelligence summary categories
    const intel = prioritiesRes.data.data.intelligence;
    assert(intel.overdue.length === 1, 'Intelligence correctly identifies 1 overdue item');
    assert(intel.urgentExams.length >= 1, 'Intelligence correctly flags urgent exam');
    assert(intel.highRiskAssignments.length >= 1, 'Intelligence correctly identifies high-risk assignments');

    // ----------------------------------------------------
    // F. RECOMMENDATION API ("What to work on next?")
    // ----------------------------------------------------
    console.log('\n6. Smart Recommendation API:');
    const recRes = await request(serverInstance, 'GET', '/api/planner/recommendation', {
      Authorization: `Bearer ${token}`
    });
    assert(recRes.status === 200, 'GET /api/planner/recommendation returns 200 OK');
    assert(Boolean(recRes.data.data.recommendation), 'Returns top recommended work item');
    assert(Boolean(recRes.data.data.recommendation.reason), 'Recommendation includes human-readable explainable reason');
    assert(Boolean(recRes.data.data.backupRecommendation), 'Returns backup recommendation');

    // ----------------------------------------------------
    // G. 7-DAY STUDY SCHEDULE (NON-OVERBOOKING)
    // ----------------------------------------------------
    console.log('\n7. Study Schedule Allocator (Strict Non-Overbooking):');
    const scheduleRes = await request(serverInstance, 'GET', '/api/planner/schedule', {
      Authorization: `Bearer ${token}`
    });
    assert(scheduleRes.status === 200, 'GET /api/planner/schedule returns 200 OK');

    const schedule = scheduleRes.data.data.schedule;
    assert(schedule.length === 7, 'Schedule generated for 7 upcoming days');

    // Verify non-overbooking constraint across all 7 days
    const allWithinLimits = schedule.every((day) => day.scheduledHours <= day.availableHours);
    assert(allWithinLimits, 'RULE VERIFIED: No day has scheduled hours exceeding available study hours!');

    const hasSessions = schedule.some((day) => day.sessions.length > 0);
    assert(hasSessions, 'Schedule successfully allocates sessions to available days');

    console.log(`\n=========================================`);
    console.log(`🎉 PHASE 4 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
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

runPhase4Tests();
