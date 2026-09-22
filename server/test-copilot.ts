import app from './src/app';
import http from 'http';
import prisma from './src/lib/prisma';
import { queryCopilot, draftAssignmentWithAI } from './src/services/copilot.service';

async function runTests() {
  console.log('🧪 Starting Milestone 4 (Teacher AI Copilot & Natural-Language Queries) Test Suite...\n');

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
    // 1. Direct Service Testing
    console.log('  1. Testing Copilot Service Directly:');

    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacher) throw new Error('No seeded teacher found in database');

    // 1.1 Pending evaluations query
    const pendingResult = await queryCopilot({
      teacherId: teacher.id,
      query: 'How many papers do I still have to check?',
    });
    assert(
      pendingResult.inboxBreakdown !== undefined,
      'Copilot pending query returns structured inboxBreakdown'
    );
    assert(
      typeof pendingResult.inboxBreakdown?.totalPending === 'number',
      'Pending evaluations total count is a valid number'
    );
    assert(
      Array.isArray(pendingResult.inboxBreakdown?.courses),
      'Pending breakdown contains courses array'
    );

    // 1.2 Unsubmitted students query
    const missingResult = await queryCopilot({
      teacherId: teacher.id,
      query: "Which students haven't submitted DBMS Assignment 1?",
    });
    assert(
      missingResult.studentsList !== undefined,
      'Missing submissions query returns structured studentsList'
    );
    assert(
      Array.isArray(missingResult.studentsList),
      'Unsubmitted students returned as an array'
    );

    // 1.3 Similarity flags query
    const similarityResult = await queryCopilot({
      teacherId: teacher.id,
      query: 'Show similarity flags',
    });
    assert(
      similarityResult.flaggedList !== undefined,
      'Similarity query returns structured flaggedList'
    );
    assert(
      Array.isArray(similarityResult.flaggedList),
      'Flagged similarity matches returned as an array'
    );

    // 1.4 Performance analytics query
    const analyticsResult = await queryCopilot({
      teacherId: teacher.id,
      query: 'How did my class perform in Assignment 1?',
    });
    assert(
      analyticsResult.text.length > 0,
      'Performance analytics returns conversational explanation'
    );

    // 1.5 Missing fields prompt for incomplete assignment draft
    const incompleteDraftResult = await queryCopilot({
      teacherId: teacher.id,
      query: 'Create an assignment called Normalization',
    });
    assert(
      incompleteDraftResult.missingFieldsPrompt !== undefined,
      'Incomplete assignment request prompts for missing academic fields'
    );
    assert(
      incompleteDraftResult.missingFieldsPrompt?.requiredFields.length! > 0,
      'Required missing fields array populated'
    );

    // 1.6 Dangerous action safety guardrail (delete assignment)
    const dangerousResult = await queryCopilot({
      teacherId: teacher.id,
      query: 'Delete assignment',
    });
    assert(
      dangerousResult.confirmationPrompt !== undefined,
      'Dangerous action triggers confirmation prompt'
    );
    assert(
      dangerousResult.confirmationPrompt?.actionType === 'delete_assignment',
      'Action type is correctly set to delete_assignment'
    );

    // 1.7 AI Assignment Drafter
    const draftResult = await draftAssignmentWithAI({
      prompt: 'Create an assignment on B+ Tree Indexing with 3 rubrics for 50 marks',
      totalMarks: 50,
    });
    assert(
      draftResult.rubric.length >= 3,
      'AI Assignment Drafter synthesizes at least 3 rubric criteria'
    );
    const sumMarks = draftResult.rubric.reduce((acc, r) => acc + r.maxMarks, 0);
    assert(
      sumMarks === 50,
      `Rubric criterion maxMarks sum matches requested totalMarks (50 === ${sumMarks})`
    );

    // 2. HTTP API & RBAC Testing
    console.log('\n  2. Testing HTTP Endpoints & RBAC Security:');

    // 2.1 Authenticate Teacher
    const teacherLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher', password: 'teacher123' }),
    });
    const teacherData = (await teacherLoginRes.json()) as any;
    const teacherToken = teacherData.token;

    // 2.2 Authenticate Student
    const studentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student', password: 'student123' }),
    });
    const studentData = (await studentLoginRes.json()) as any;
    const studentToken = studentData.token;

    assert(!!teacherToken && !!studentToken, 'Teacher and Student authenticated successfully');

    // 2.3 POST /api/v1/copilot/query (Teacher: 200 OK)
    const copilotQueryRes = await fetch(`${baseUrl}/api/v1/copilot/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ query: 'How many papers do I still have to check?' }),
    });
    const queryData = (await copilotQueryRes.json()) as any;
    assert(
      copilotQueryRes.status === 200,
      'Teacher POST /copilot/query returns 200 OK'
    );
    assert(
      queryData.success === true && queryData.data?.inboxBreakdown !== undefined,
      'Response contains structured inbox breakdown'
    );

    // 2.4 POST /api/v1/copilot/draft-assignment (Teacher: 200 OK)
    const draftAssignmentRes = await fetch(`${baseUrl}/api/v1/copilot/draft-assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        prompt: 'Create an assignment on B+ Tree Indexing for 100 marks with 3 rubrics',
        totalMarks: 100,
      }),
    });
    const draftApiData = (await draftAssignmentRes.json()) as any;
    assert(
      draftAssignmentRes.status === 200,
      'Teacher POST /copilot/draft-assignment returns 200 OK'
    );
    assert(
      draftApiData.success === true && draftApiData.data?.rubric?.length >= 3,
      'Draft response returns valid rubric list'
    );

    // 2.5 RBAC: Student blocked from /copilot/query (403 Forbidden)
    const studentQueryRes = await fetch(`${baseUrl}/api/v1/copilot/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ query: 'How many papers do I still have to check?' }),
    });
    assert(
      studentQueryRes.status === 403,
      'Student blocked from /copilot/query (403 Forbidden)'
    );

    // 2.6 RBAC: Student blocked from /copilot/draft-assignment (403 Forbidden)
    const studentDraftRes = await fetch(`${baseUrl}/api/v1/copilot/draft-assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ prompt: 'Create an assignment' }),
    });
    assert(
      studentDraftRes.status === 403,
      'Student blocked from /copilot/draft-assignment (403 Forbidden)'
    );

    // 2.7 Missing authentication token (401 Unauthorized)
    const unauthRes = await fetch(`${baseUrl}/api/v1/copilot/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Check papers' }),
    });
    assert(
      unauthRes.status === 401,
      'Unauthenticated request rejected with 401 Unauthorized'
    );

    // 2.8 Input validation error: empty query (400 Bad Request)
    const invalidRes = await fetch(`${baseUrl}/api/v1/copilot/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ query: '' }),
    });
    assert(
      invalidRes.status === 400,
      'Empty query rejected with 400 ValidationError'
    );
  } catch (error: any) {
    console.error('Test error:', error);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n📊 Copilot Test Summary: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
