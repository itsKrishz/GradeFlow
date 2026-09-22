import app from './src/app';
import http from 'http';
import prisma from './src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('🧪 Starting Milestone 2 (Asynchronous Pipeline & Extraction) Test Suite...\n');

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

    // 2. Query or create a test course and assignment
    const course = await prisma.course.findFirst({ where: { code: 'CS301' } });
    assert(Boolean(course), 'CS301 course found');

    const assignment = await prisma.assignment.findFirst({
      where: { courseId: course!.id },
      include: { rubricCriteria: true },
    });
    assert(Boolean(assignment), 'CS301 Assignment found with rubrics');
    const assignmentId = assignment!.id;

    // 3. Prepare a physical sample submission file on disk
    const sampleDir = path.join(process.cwd(), 'uploads/submissions');
    if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir, { recursive: true });

    const sampleFileName = `test-pipeline-${Date.now()}.sql`;
    const sampleFilePath = path.join(sampleDir, sampleFileName);
    const sampleCode = `-- GradeFlow Database Engineering Submission
CREATE TABLE academic_records (
    student_id UUID NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    letter_grade CHAR(2) NOT NULL,
    evaluation_score NUMERIC(5,2) CHECK (evaluation_score >= 0.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_academic_records PRIMARY KEY (student_id, course_code)
);

CREATE INDEX idx_academic_course ON academic_records (course_code);
-- 3NF Decomposition proof: Every non-prime attribute is non-transitively dependent on key.
`;
    await fs.promises.writeFile(sampleFilePath, sampleCode, 'utf-8');

    // 4. Submit assignment via POST /api/v1/submissions
    const submitRes = await fetch(`${baseUrl}/api/v1/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId,
        fileName: sampleFileName,
        fileSize: '1.4 KB',
        fileUrl: `uploads/submissions/${sampleFileName}`,
      }),
    });

    const submitData: any = await submitRes.json();
    assert(submitRes.status === 202, 'Submission accepted asynchronously with HTTP 202 Accepted');
    assert(Boolean(submitData.submission?.id), 'Submission returns valid submission ID');
    assert(submitData.pipeline?.status === 'PENDING', 'Pipeline returned with initial PENDING status');
    const submissionId = submitData.submission.id;

    // 5. Test real-time status polling endpoint GET /api/v1/submissions/:id/status
    const statusRes = await fetch(`${baseUrl}/api/v1/submissions/${submissionId}/status`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const statusData: any = await statusRes.json();
    assert(statusRes.status === 200, 'GET /submissions/:id/status returns 200 OK');
    assert(typeof statusData.progress === 'number', 'Status endpoint returns numeric progress percentage');

    // 6. Wait for background worker pipeline to complete (sleep up to 1500ms)
    console.log('  ⏳ Waiting for asynchronous background pipeline to process...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 7. Verify submission completed in database
    const completedSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        evaluation: true,
        similarityReport: true,
      },
    });

    assert(
      completedSubmission?.processingState === 'COMPLETED',
      'Pipeline transitioned processingState to COMPLETED'
    );
    assert(
      Boolean(completedSubmission?.fileText && completedSubmission.fileText.includes('academic_records')),
      'Extractor service successfully parsed document text into PostgreSQL'
    );
    assert(
      Boolean(completedSubmission?.similarityReport),
      'Similarity service computed similarity report and saved to PostgreSQL'
    );
    assert(
      Boolean(completedSubmission?.evaluation && completedSubmission.evaluation.totalScore > 0),
      'AI rubric evaluation draft generated and saved to PostgreSQL'
    );

    // 8. Verify instructor notification was sent
    const notification = await prisma.notification.findFirst({
      where: {
        userId: course!.teacherId,
        title: 'Submission Pipeline Completed',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(Boolean(notification), 'Automated instructor notification triggered in PostgreSQL');

    // Clean up sample file
    if (fs.existsSync(sampleFilePath)) {
      await fs.promises.unlink(sampleFilePath).catch(() => {});
    }

    console.log(`\n📊 Pipeline Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
