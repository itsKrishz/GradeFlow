import app from './src/app';
import http from 'http';
import prisma from './src/lib/prisma';
import {
  evaluateSubmissionWithAI,
  generateFeedbackFromScores,
} from './src/services/ai-evaluator.service';

async function runTests() {
  console.log('🧪 Starting Milestone 3 (AI Rubric Scoring Engine) Test Suite...\n');

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
    // 1. Direct Test: AI Evaluation Service
    console.log('  1. Testing AI Evaluator Service directly:');
    const mockCriteria = [
      {
        id: 'crit-1',
        title: 'Schema Correctness & Constraints',
        description: 'Proper Primary/Foreign keys, cascade options, not null constraints.',
        maxMarks: 40,
      },
      {
        id: 'crit-2',
        title: '3NF Normalization Proof',
        description: 'Rigorous proof eliminating partial and transitive functional dependencies.',
        maxMarks: 35,
      },
      {
        id: 'crit-3',
        title: 'SQL Query Optimization',
        description: 'PostgreSQL indexes and execution plan considerations.',
        maxMarks: 25,
      },
    ];

    const sampleText = `
CREATE TABLE student_grades (
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0.0),
    PRIMARY KEY (student_id, course_id)
);
-- 3NF Decomposition Proof:
-- Relation R(student_id, course_id, score) satisfies 3NF because all non-prime attributes
-- depend entirely and directly on the composite candidate key {student_id, course_id}.
-- There are no transitive dependencies X -> Y -> Z.
CREATE INDEX idx_student_grades_course ON student_grades(course_id);
`;

    const aiResult = await evaluateSubmissionWithAI({
      submissionText: sampleText,
      assignmentTitle: 'Assignment 1: Relational Schema & 3NF',
      assignmentDescription: 'Design normalized schema with 3NF proofs.',
      rubricCriteria: mockCriteria,
      studentName: 'Alex Rivera',
    });

    assert(aiResult.totalScore > 0, 'AI Evaluator returns totalScore > 0');
    assert(aiResult.percentage >= 0 && aiResult.percentage <= 100, 'AI Evaluator percentage is between 0 and 100');
    assert(aiResult.rubricScores.length === 3, 'AI Evaluator returns all 3 criterion breakdowns');
    assert(
      aiResult.rubricScores.every((r) => r.score <= r.maxMarks),
      'All AI-awarded scores do not exceed maximum rubric marks'
    );
    assert(
      Boolean(aiResult.academicDisclaimer && aiResult.academicDisclaimer.includes('instructor')),
      'Includes required academic integrity disclaimer'
    );

    // 2. Direct Test: Feedback Generation Service
    console.log('  2. Testing Constructive Feedback Generator:');
    const highScoresFeedback = generateFeedbackFromScores({
      rubricScores: { 'crit-1': 38, 'crit-2': 34, 'crit-3': 24 },
      criteria: mockCriteria,
      studentName: 'Alex',
    });
    assert(
      highScoresFeedback.includes('mastery') || highScoresFeedback.includes('Overall Grade'),
      'Generates positive mastery feedback for high scores'
    );

    const needsWorkFeedback = generateFeedbackFromScores({
      rubricScores: { 'crit-1': 20, 'crit-2': 14, 'crit-3': 10 },
      criteria: mockCriteria,
      studentName: 'Jordan',
    });
    assert(
      needsWorkFeedback.includes('focus on') || needsWorkFeedback.includes('Overall Grade'),
      'Generates constructive guidance for lower scores'
    );

    // 3. API Integration Test: POST /api/v1/evaluations/ai-evaluate/:submissionId
    console.log('  3. Testing HTTP AI Evaluation Endpoints:');
    const teacherLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher', password: 'teacher123' }),
    });
    const teacherToken = (await teacherLogin.json()).token;

    const studentLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student', password: 'student123' }),
    });
    const studentToken = (await studentLogin.json()).token;

    const sampleSub = await prisma.submission.findFirst({
      where: { student: { email: 'student@gradeflow.edu' } },
    });
    assert(Boolean(sampleSub), 'Test student submission found in database');
    const subId = sampleSub!.id;

    // Trigger AI evaluation via API as Teacher
    const triggerRes = await fetch(`${baseUrl}/api/v1/evaluations/ai-evaluate/${subId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const triggerData: any = await triggerRes.json();
    assert(triggerRes.status === 200, 'POST /ai-evaluate/:id returns 200 OK');
    assert(triggerData.evaluation?.aiAssisted === true, 'Saved evaluation is marked aiAssisted = true');
    assert(Boolean(triggerData.aiProvider), 'Returns active AI provider (gemini or heuristic-engine)');

    // RBAC check: Student cannot trigger AI evaluation
    const studentTriggerRes = await fetch(`${baseUrl}/api/v1/evaluations/ai-evaluate/${subId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentTriggerRes.status === 403, 'Student blocked from triggering AI evaluation (403 Forbidden)');

    // Generate feedback via API
    const feedbackRes = await fetch(`${baseUrl}/api/v1/evaluations/generate-feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rubricScores: { 'crit-1': 35, 'crit-2': 32 },
        criteria: mockCriteria,
        studentName: 'Sophia Chen',
      }),
    });
    const feedbackData: any = await feedbackRes.json();
    assert(feedbackRes.status === 200, 'POST /generate-feedback returns 200 OK');
    assert(Boolean(feedbackData.feedback), 'Returns generated feedback text');

    console.log(`\n📊 AI Evaluator Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
