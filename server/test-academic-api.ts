import app from './src/app';
import http from 'http';
import prisma from './src/lib/prisma';

async function runTests() {
  console.log('🧪 Starting GradeFlow Academic API (Step 1.4) Test Suite...\n');

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

    assert(Boolean(teacherToken) && Boolean(studentToken), 'Teacher and Student authenticated successfully');

    // 2. GET /api/v1/courses (Teacher perspective vs Student perspective)
    const teacherCoursesRes = await fetch(`${baseUrl}/api/v1/courses`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherCoursesData: any = await teacherCoursesRes.json();
    assert(teacherCoursesRes.status === 200, 'GET /courses (Teacher) returns 200 OK');
    assert(teacherCoursesData.count >= 2, 'Teacher sees their taught courses (CS301, CS302, etc.)');

    const studentCoursesRes = await fetch(`${baseUrl}/api/v1/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentCoursesData: any = await studentCoursesRes.json();
    assert(studentCoursesRes.status === 200, 'GET /courses (Student) returns 200 OK');
    assert(Array.isArray(studentCoursesData.courses), 'Student receives array of enrolled courses');

    // 3. RBAC: Student cannot create a course
    const studentCreateCourseRes = await fetch(`${baseUrl}/api/v1/courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'CS999',
        name: 'Hacking 101',
        semester: 'Fall 2026',
      }),
    });
    assert(studentCreateCourseRes.status === 403, 'Student blocked from creating course (403 Forbidden)');

    // 4. Teacher creates a new course
    const testCourseCode = `CS_T${Date.now().toString().slice(-4)}`;
    const teacherCreateCourseRes = await fetch(`${baseUrl}/api/v1/courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: testCourseCode,
        name: 'Distributed Cloud Computing',
        semester: 'Spring 2027',
        department: 'Computer Science',
      }),
    });
    const createdCourseData: any = await teacherCreateCourseRes.json();
    assert(teacherCreateCourseRes.status === 201, 'Teacher creates course successfully (201 Created)');
    const createdCourseId = createdCourseData.course?.id;

    // 5. Teacher creates an assignment with nested rubric criteria
    const createAssignmentRes = await fetch(`${baseUrl}/api/v1/assignments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        title: 'Project 1: Consensus Protocols (Raft)',
        description: 'Implement leader election and log replication using gRPC.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        dueTime: '23:59',
        totalMarks: 100,
        acceptedFileTypes: ['go', 'zip'],
        rubricCriteria: [
          {
            title: 'Leader Election Protocol',
            description: 'Handles split votes and randomized election timeouts properly.',
            maxMarks: 50,
          },
          {
            title: 'Log Replication & Consistency',
            description: 'Maintains state machine safety across network partitions.',
            maxMarks: 50,
          },
        ],
      }),
    });
    const createdAssignmentData: any = await createAssignmentRes.json();
    assert(createAssignmentRes.status === 201, 'Teacher creates assignment with rubrics (201 Created)');
    assert(createdAssignmentData.assignment?.rubricCriteria?.length === 2, 'Assignment has 2 nested rubric criteria');
    const createdAssignmentId = createdAssignmentData.assignment?.id;

    // 6. RBAC: Student cannot create assignment
    const studentCreateAssignmentRes = await fetch(`${baseUrl}/api/v1/assignments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: createdCourseId,
        title: 'Unauthorized Assignment',
        description: 'Testing',
        dueDate: new Date().toISOString(),
      }),
    });
    assert(studentCreateAssignmentRes.status === 403, 'Student blocked from creating assignment (403 Forbidden)');

    // 7. GET /api/v1/assignments?courseId=...
    const getAssignmentsRes = await fetch(`${baseUrl}/api/v1/assignments?courseId=${createdCourseId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const getAssignmentsData: any = await getAssignmentsRes.json();
    assert(getAssignmentsRes.status === 200, 'GET /assignments?courseId=... returns 200 OK');
    assert(getAssignmentsData.count === 1, 'Returns the newly created assignment');

    // 8. Student submission enrollment guard:
    // Student is not enrolled in this newly created course yet -> should receive 403
    const submitUnenrolledRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: createdAssignmentId,
        fileName: 'raft_solution.zip',
        fileSize: '1.2 MB',
      }),
    });
    assert(submitUnenrolledRes.status === 403, 'Submission blocked if student is not enrolled in course (403 Forbidden)');

    // Enroll student in the test course via DB helper
    const studentUser = await prisma.user.findUnique({ where: { email: 'student@gradeflow.edu' } });
    await prisma.courseEnrollment.create({
      data: {
        courseId: createdCourseId,
        studentId: studentUser!.id,
      },
    });

    // 9. Student submits assignment after enrollment
    const submitValidRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: createdAssignmentId,
        fileName: 'raft_solution.zip',
        fileSize: '1.2 MB',
        fileText: 'package raft\n\nfunc (rf *Raft) RequestVote(...) { ... }',
      }),
    });
    const submitValidData: any = await submitValidRes.json();
    assert(submitValidRes.status === 201, 'Student successfully submits assignment (201 Created)');
    assert(submitValidData.submission?.status === 'SUBMITTED', 'Submission status is SUBMITTED');
    const createdSubmissionId = submitValidData.submission?.id;

    // 10. GET /api/v1/submissions (Teacher sees submissions)
    const teacherSubmissionsRes = await fetch(`${baseUrl}/api/v1/submissions?assignmentId=${createdAssignmentId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherSubmissionsData: any = await teacherSubmissionsRes.json();
    assert(teacherSubmissionsRes.status === 200, 'Teacher queries assignment submissions (200 OK)');
    assert(teacherSubmissionsData.count === 1, 'Teacher sees 1 student submission in roster');

    // 11. Student can view their own submission
    const getSubmissionRes = await fetch(`${baseUrl}/api/v1/submissions/${createdSubmissionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getSubmissionRes.status === 200, 'Student views their own submission (200 OK)');

    // 12. Delete assignment and course cleanup
    const deleteAssignmentRes = await fetch(`${baseUrl}/api/v1/assignments/${createdAssignmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(deleteAssignmentRes.status === 200, 'Teacher deletes assignment successfully (200 OK)');

    const deleteCourseRes = await fetch(`${baseUrl}/api/v1/courses/${createdCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(deleteCourseRes.status === 200, 'Teacher deletes course successfully (200 OK)');

    console.log(`\n📊 Academic API Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
