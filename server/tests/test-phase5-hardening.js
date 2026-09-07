const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const { connectDB, disconnectDB } = require('../src/config/db');
const app = require('../src/app');
const ProjectUpdate = require('../src/models/ProjectUpdate');

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

const runPhase5HardeningTests = async () => {
  console.log('🧪 Starting Phase 5 Backend Hardening, Security & API Documentation Tests...\n');

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

    // 1. API Documentation endpoint
    console.log('1. API Documentation Specification:');
    const docRes = await request(serverInstance, 'GET', '/api/docs');
    assert(docRes.status === 200, 'GET /api/docs returns 200 OK');
    assert(docRes.data.success === true, 'Documentation response success is true');
    assert(Array.isArray(docRes.data.data.modules), 'Documentation contains modules array');
    assert(docRes.data.data.modules.length === 7, 'All 7 functional modules documented');

    // 2. Security HTTP Headers (Helmet verification)
    console.log('\n2. Security HTTP Headers:');
    assert(docRes.headers['x-content-type-options'] === 'nosniff', 'Header x-content-type-options: nosniff present');
    assert(Boolean(docRes.headers['x-dns-prefetch-control']), 'Header x-dns-prefetch-control present');

    // 3. User Setup for Deep Hardening Tests
    const ts = Date.now();
    const userRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Hardening Admin',
      email: `admin_${ts}@example.com`,
      password: 'Password123!',
      role: 'admin'
    });
    const token = userRes.data.data.token;

    // 4. Uniform Error Envelope Structure Verification
    console.log('\n3. Error Format Uniformity:');
    const notFoundRes = await request(serverInstance, 'GET', '/api/non-existent-route');
    assert(notFoundRes.status === 404, 'Undefined route returns 404');
    assert(notFoundRes.data.success === false, 'Error envelope contains success: false');
    assert(typeof notFoundRes.data.message === 'string', 'Error envelope contains readable string message');

    const invalidIdRes = await request(serverInstance, 'GET', '/api/projects/invalid-mongo-id', {
      Authorization: `Bearer ${token}`
    });
    assert(invalidIdRes.status === 400, 'Invalid MongoDB ObjectId cast returns 400');
    assert(invalidIdRes.data.success === false, 'CastError envelope contains success: false');

    // 5. Complete Cascade Deletion (Tasks AND ProjectUpdate records)
    console.log('\n4. Complete Cascade Deletion Hardening:');
    const projRes = await request(serverInstance, 'POST', '/api/projects', {
      Authorization: `Bearer ${token}`
    }, {
      title: 'Cascade Hardening Project',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    });
    const projId = projRes.data.data.project._id;

    // Create task
    await request(serverInstance, 'POST', `/api/projects/${projId}/tasks`, {
      Authorization: `Bearer ${token}`
    }, {
      title: 'Sub-task for cascade test',
      estimatedEffort: 3
    });

    // Create project update
    await request(serverInstance, 'POST', `/api/projects/${projId}/updates`, {
      Authorization: `Bearer ${token}`
    }, {
      text: 'Sample status update for cascade test'
    });

    // Verify update exists in DB
    const updatesBefore = await ProjectUpdate.countDocuments({ project: projId });
    assert(updatesBefore === 1, 'ProjectUpdate record exists before deletion');

    // Delete Project
    const delRes = await request(serverInstance, 'DELETE', `/api/projects/${projId}`, {
      Authorization: `Bearer ${token}`
    });
    assert(delRes.status === 200, 'DELETE /api/projects/:id returns 200');

    // Verify update was deleted via cascade
    const updatesAfter = await ProjectUpdate.countDocuments({ project: projId });
    assert(updatesAfter === 0, 'Associated ProjectUpdate documents cascade deleted without orphans');

    // 6. Root Informational Endpoint
    console.log('\n5. Root Informational Endpoint:');
    const rootRes = await request(serverInstance, 'GET', '/');
    assert(rootRes.status === 200, 'GET / returns 200 OK');
    assert(rootRes.data.status === 'operational', 'Root status is operational');
    assert(rootRes.data.documentation === '/api/docs', 'Root links to /api/docs');

    console.log(`\n=========================================`);
    console.log(`🎉 PHASE 5 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
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

runPhase5HardeningTests();
