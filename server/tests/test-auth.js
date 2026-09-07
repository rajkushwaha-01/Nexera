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
      path,
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

const runAuthTests = async () => {
  console.log('🧪 Starting Phase 1 Authentication & Foundation Tests...\n');

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
    console.log(`[Test Server] Running on ephemeral port ${testPort}\n`);

    // 1. Health check
    console.log('1. Health Check Route:');
    const healthRes = await request(serverInstance, 'GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.data.success === true, 'GET /api/health success flag is true');
    assert(healthRes.data.data.status === 'healthy', 'Database & server status is healthy');

    // 2. Validation failures on registration
    console.log('\n2. Validation Error Handling:');
    const badRegRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'A',
      email: 'invalid-email',
      password: '123'
    });
    assert(badRegRes.status === 400, 'POST /api/auth/register rejects invalid inputs with 400');
    assert(badRegRes.data.success === false, 'Rejection response contains success: false');
    assert(Array.isArray(badRegRes.data.errors) && badRegRes.data.errors.length >= 3, 'Returns detailed field validation errors');

    // 3. Successful Registration
    console.log('\n3. Successful User Registration:');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Alex Johnson',
      email: testEmail,
      password: 'Password123!',
      role: 'student',
      title: 'Computer Science Sophomore',
      department: 'Engineering'
    });
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regRes.data.success === true, 'Registration success is true');
    assert(Boolean(regRes.data.data.token), 'Registration returns JWT token');
    assert(regRes.data.data.user.email === testEmail, 'User payload has matching email');
    assert(!regRes.data.data.user.password, 'Password is omitted from user payload');
    assert(regRes.data.data.user.role === 'student', 'User assigned student role by default');

    // 3b. Register member role
    const memberEmail = `member_${Date.now()}@example.com`;
    const memberRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Sarah Team Lead',
      email: memberEmail,
      password: 'Password123!',
      role: 'member'
    });
    assert(memberRes.status === 201, 'POST /api/auth/register with role member succeeds');
    assert(memberRes.data.data.user.role === 'member', 'User assigned member role');

    // 3c. Register admin role
    const adminEmail = `admin_${Date.now()}@example.com`;
    const adminRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Admin User',
      email: adminEmail,
      password: 'Password123!',
      role: 'admin'
    });
    assert(adminRes.status === 201, 'POST /api/auth/register with role admin succeeds');
    assert(adminRes.data.data.user.role === 'admin', 'User assigned admin role');

    // 3d. Reject invalid role
    const invalidRoleRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Hacker User',
      email: `badrole_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'superadmin'
    });
    assert(invalidRoleRes.status === 400, 'POST /api/auth/register rejects unauthorized role');

    // 4. Duplicate Email Registration
    console.log('\n4. Duplicate Email Prevention:');
    const dupRegRes = await request(serverInstance, 'POST', '/api/auth/register', {}, {
      name: 'Duplicate Alex',
      email: testEmail,
      password: 'Password123!'
    });
    assert(dupRegRes.status === 400 || dupRegRes.status === 409, 'Duplicate email registration rejected with 400/409');

    // 5. Invalid Login
    console.log('\n5. Invalid Login Handling:');
    const badLoginRes = await request(serverInstance, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'WrongPassword999!'
    });
    assert(badLoginRes.status === 401, 'POST /api/auth/login rejects incorrect password with 401');

    // 6. Valid Login
    console.log('\n6. Valid Login:');
    const loginRes = await request(serverInstance, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'Password123!'
    });
    assert(loginRes.status === 200, 'POST /api/auth/login succeeds with 200 OK');
    assert(Boolean(loginRes.data.data.token), 'Login returns JWT token');
    const token = loginRes.data.data.token;

    // 7. Protected Route Access Without Token
    console.log('\n7. Protected Route Authorization Guards:');
    const unauthRes = await request(serverInstance, 'GET', '/api/auth/me');
    assert(unauthRes.status === 401, 'GET /api/auth/me without token returns 401 Unauthorized');

    // 8. Protected Route Access With Token
    console.log('\n8. Authenticated User Profile Retrieval:');
    const meRes = await request(serverInstance, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${token}`
    });
    assert(meRes.status === 200, 'GET /api/auth/me with Bearer token returns 200 OK');
    assert(meRes.data.data.user.name === 'Alex Johnson', 'Returns correct authenticated user');

    // 9. Update Profile
    console.log('\n9. Update User Profile:');
    const updateRes = await request(serverInstance, 'PUT', '/api/auth/me', {
      Authorization: `Bearer ${token}`
    }, {
      name: 'Alex Johnson, B.Sc',
      weeklyStudyHours: {
        monday: 3,
        tuesday: 4,
        wednesday: 2,
        thursday: 3,
        friday: 1,
        saturday: 6,
        sunday: 5
      }
    });
    assert(updateRes.status === 200, 'PUT /api/auth/me returns 200 OK');
    assert(updateRes.data.data.user.name === 'Alex Johnson, B.Sc', 'User name updated successfully');
    assert(updateRes.data.data.user.weeklyStudyHours.monday === 3, 'Weekly study hours updated');

    // 10. Change Password
    console.log('\n10. Password Change:');
    const changePassRes = await request(serverInstance, 'PUT', '/api/auth/change-password', {
      Authorization: `Bearer ${token}`
    }, {
      currentPassword: 'Password123!',
      newPassword: 'BrandNewSecurePassword456!'
    });
    assert(changePassRes.status === 200, 'PUT /api/auth/change-password returns 200 OK');

    // 11. Login with new password
    console.log('\n11. Verify New Password Login:');
    const newLoginRes = await request(serverInstance, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'BrandNewSecurePassword456!'
    });
    assert(newLoginRes.status === 200, 'POST /api/auth/login succeeds with updated password');

    console.log(`\n=========================================`);
    console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
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

runAuthTests();
