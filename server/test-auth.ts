import app from './src/app';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Authentication & RBAC Test Suite...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Teacher login with username 'teacher' and password 'teacher123'
    const teacherLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher', password: 'teacher123' }),
    });
    const teacherLoginData: any = await teacherLoginRes.json();
    assert(teacherLoginRes.status === 200, 'Teacher login returns 200 OK');
    assert(Boolean(teacherLoginData.token), 'Teacher login returns a valid JWT token');
    assert(teacherLoginData.user?.role === 'TEACHER', 'Teacher user role is TEACHER');
    const teacherToken = teacherLoginData.token;

    // Test 2: Student login with email 'student@gradeflow.edu' and password 'student123'
    const studentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student@gradeflow.edu', password: 'student123' }),
    });
    const studentLoginData: any = await studentLoginRes.json();
    assert(studentLoginRes.status === 200, 'Student login returns 200 OK');
    assert(studentLoginData.user?.role === 'STUDENT', 'Student user role is STUDENT');
    const studentToken = studentLoginData.token;

    // Test 3: Admin login with username 'admin' and password 'admin123'
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
    assert(adminLoginData.user?.role === 'ADMIN', 'Admin user role is ADMIN');

    // Test 4: Invalid password rejects with 401
    const invalidRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher', password: 'wrong_password_999' }),
    });
    assert(invalidRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // Test 5: GET /me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const meData: any = await meRes.json();
    assert(meRes.status === 200, 'GET /me returns 200 OK with valid token');
    assert(meData.user?.email === 'teacher@gradeflow.edu', 'GET /me returns correct user data');

    // Test 6: RBAC - Teacher accesses teacher-only route
    const teacherAccessRes = await fetch(`${baseUrl}/api/v1/auth/test-teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(teacherAccessRes.status === 200, 'Teacher can access Teacher/Admin protected route');

    // Test 7: RBAC - Student attempts to access teacher-only route (Should be 403 Forbidden)
    const studentForbiddenRes = await fetch(`${baseUrl}/api/v1/auth/test-teacher`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentForbiddenRes.status === 403, 'Student is forbidden (403) from Teacher-only route');

    // Test 8: RBAC - Student accesses student-only route
    const studentAccessRes = await fetch(`${baseUrl}/api/v1/auth/test-student`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAccessRes.status === 200, 'Student can access Student protected route');

    // Test 9: Unauthenticated request rejected with 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert(unauthRes.status === 401, 'Missing token is rejected with 401 Unauthorized');

    console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
