import app from './src/app';
import http from 'http';
import prisma from './src/lib/prisma';

async function runTests() {
  console.log('🧪 Starting Evaluations & Similarity API Test Suite...\n');

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
    // 1. Authenticate Teacher and Student
    const teacherLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher', password: 'teacher123' }),
    });
    const teacherData: any = await teacherLogin.json();
    const teacherToken = teacherData.token;

    const studentLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student', password: 'student123' }),
    });
    const studentData: any = await studentLogin.json();
    const studentToken = studentData.token;

    assert(Boolean(teacherToken) && Boolean(studentToken), 'Teacher and Student authenticated');

    // 2. Query seeded submission for testing
    const sampleSubmission = await prisma.submission.findFirst({
      where: { student: { email: 'student@gradeflow.edu' } },
    });
    assert(Boolean(sampleSubmission), 'Seeded student submission exists in database');
    const submissionId = sampleSubmission!.id;

    // 3. GET /api/v1/evaluations as Teacher
    const teacherEvalsRes = await fetch(`${baseUrl}/api/v1/evaluations`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherEvalsData: any = await teacherEvalsRes.json();
    assert(teacherEvalsRes.status === 200, 'GET /evaluations (Teacher) returns 200 OK');
    assert(teacherEvalsData.count >= 1, 'Teacher sees evaluation records');

    // 4. GET /api/v1/evaluations as Student (scoped)
    const studentEvalsRes = await fetch(`${baseUrl}/api/v1/evaluations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentEvalsData: any = await studentEvalsRes.json();
    assert(studentEvalsRes.status === 200, 'GET /evaluations (Student) returns 200 OK');
    assert(
      studentEvalsData.evaluations.every((e: any) => e.submission.student.email === 'student@gradeflow.edu'),
      'Student only receives evaluations belonging to themselves'
    );

    // 5. GET /api/v1/evaluations/submission/:submissionId
    const getEvalByIdRes = await fetch(`${baseUrl}/api/v1/evaluations/submission/${submissionId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const getEvalByIdData: any = await getEvalByIdRes.json();
    assert(getEvalByIdRes.status === 200, 'GET /evaluations/submission/:id returns 200 OK');
    assert(getEvalByIdData.evaluation?.totalScore > 0, 'Evaluation returns valid score');

    // 6. RBAC: Student cannot save or alter evaluations
    const studentSaveEvalRes = await fetch(`${baseUrl}/api/v1/evaluations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId,
        totalScore: 100,
        percentage: 100,
        grade: 'A+',
        feedback: 'Hacked grade',
        rubricScores: [],
      }),
    });
    assert(studentSaveEvalRes.status === 403, 'Student blocked from saving evaluation (403 Forbidden)');

    // 7. Teacher saves updated evaluation
    const teacherSaveEvalRes = await fetch(`${baseUrl}/api/v1/evaluations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId,
        totalScore: 96.5,
        percentage: 96.5,
        grade: 'A+',
        feedback: 'Updated evaluation feedback via API.',
        rubricScores: [
          { criterionTitle: 'Schema Correctness', score: 35, maxMarks: 35 },
          { criterionTitle: '3NF Decomposition', score: 34, maxMarks: 35 },
          { criterionTitle: 'SQL Optimization', score: 27.5, maxMarks: 30 },
        ],
        aiAssisted: true,
        published: true,
      }),
    });
    const teacherSaveEvalData: any = await teacherSaveEvalRes.json();
    assert(teacherSaveEvalRes.status === 200, 'Teacher saves evaluation successfully (200 OK)');
    assert(teacherSaveEvalData.evaluation?.totalScore === 96.5, 'Saved score is accurately updated');

    // 8. Teacher updates similarity report and flags submission
    const updateSimRes = await fetch(`${baseUrl}/api/v1/evaluations/similarity/${submissionId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        overallScore: 89.2,
        threshold: 30.0,
        flagged: true,
        matchedSource: 'Archived CS-301 Solution Repository',
      }),
    });
    const updateSimData: any = await updateSimRes.json();
    assert(updateSimRes.status === 200, 'Teacher updates similarity report (200 OK)');
    assert(updateSimData.similarityReport?.flagged === true, 'Similarity report is flagged');

    // 9. RBAC: Student cannot update similarity report
    const studentSimRes = await fetch(`${baseUrl}/api/v1/evaluations/similarity/${submissionId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        overallScore: 0,
        flagged: false,
      }),
    });
    assert(studentSimRes.status === 403, 'Student blocked from editing similarity report (403 Forbidden)');

    console.log(`\n📊 Evaluations API Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
