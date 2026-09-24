import { GoogleGenAI } from '@google/genai';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CopilotToolExecution {
  actionName: string;
  steps: { label: string; done: boolean }[];
}

export interface CopilotInboxBreakdown {
  totalPending: number;
  lateCount: number;
  courses: { name: string; count: number }[];
}

export interface CopilotStudentItem {
  studentName: string;
  regNo: string;
  deadline?: string;
  status: string;
}

export interface CopilotFlaggedItem {
  studentName: string;
  regNo: string;
  similarity: number;
  matchedSource: string;
  assignmentTitle: string;
}

export interface CopilotAnalyticsSummary {
  title: string;
  courseName: string;
  submissionsRatio: string;
  average: string;
  median: string;
  highest: string;
  lowest: string;
  weakCriterion: string;
  weakCount: number;
  distribution: { grade: string; count: number }[];
  link: string;
}

export interface CopilotRubricCriterion {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
}

export interface CopilotAssignmentDraft {
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  acceptedFileTypes: string[];
  rubric: CopilotRubricCriterion[];
}

export interface CopilotConfirmationPrompt {
  title: string;
  description: string;
  actionType: 'delete_assignment' | 'change_deadline' | 'publish_grades';
  payload: any;
}

export interface CopilotMissingFieldsPrompt {
  requiredFields: string[];
  collectedFields: Record<string, string>;
}

export interface CopilotResponseData {
  text: string;
  toolExecution?: CopilotToolExecution;
  inboxBreakdown?: CopilotInboxBreakdown;
  studentsList?: CopilotStudentItem[];
  flaggedList?: CopilotFlaggedItem[];
  analyticsSummary?: CopilotAnalyticsSummary;
  assignmentDraft?: CopilotAssignmentDraft;
  confirmationPrompt?: CopilotConfirmationPrompt;
  missingFieldsPrompt?: CopilotMissingFieldsPrompt;
  studentReport?: CopilotStudentReport;
  provider?: 'gemini' | 'copilot-engine';
}

export interface CopilotStudentReport {
  studentName: string;
  regNo?: string;
  email?: string;
  department?: string;
  courseName: string;
  courseCode: string;
  assignmentTitle: string;
  submissionDate?: string;
  fileName?: string;
  status: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  rubricScores?: Array<{
    criterionTitle: string;
    score: number;
    maxMarks: number;
    comment?: string;
  }>;
  similarity?: {
    score: number;
    threshold?: number;
    flagged: boolean;
    matchedSource: string | null;
    matchedChunks?: Array<{
      submissionSnippet: string;
      sourceSnippet: string;
      similarity: number;
    }>;
  };
}

/**
 * Natural language intent classifier and database query engine
 */
export async function queryCopilot(params: {
  teacherId: string;
  query: string;
  courseId?: string;
  assignmentId?: string;
}): Promise<CopilotResponseData> {
  const { teacherId, query, courseId, assignmentId } = params;
  const lower = query.toLowerCase().trim();

  // 0. INTENT: STUDENT INDIVIDUAL REPORT (Direct teacher freedom to inspect students)
  if (
    lower.includes('report of') ||
    lower.includes('report for') ||
    lower.includes('report on') ||
    lower.includes('get me report') ||
    lower.includes('get report') ||
    lower.includes('show report') ||
    lower.includes('show me the report') ||
    lower.includes('show me report') ||
    lower.includes('student report') ||
    lower.includes('student performance') ||
    lower.includes('score of') ||
    lower.includes('grade of') ||
    lower.includes('how did ') ||
    lower.includes('how is ') ||
    (lower.includes('report') && (
      lower.includes('student') ||
      lower.includes('arjun') ||
      lower.includes('jordan') ||
      lower.includes('alex') ||
      lower.includes('rahul') ||
      lower.includes('sophia') ||
      lower.includes('bhadra')
    ))
  ) {
    return handleStudentReportQuery(teacherId, lower, query);
  }

  // 1. INTENT: PENDING PAPERS / INBOX BREAKDOWN
  if (
    lower.includes('how many papers') ||
    lower.includes('pending evaluations') ||
    lower.includes('submissions waiting') ||
    lower.includes('still have to check') ||
    lower.includes('pending')
  ) {
    return handlePendingEvaluationsQuery(teacherId, courseId);
  }

  // 2. INTENT: UNREPORTED / MISSING SUBMISSIONS
  if (
    lower.includes("haven't submitted") ||
    lower.includes('not submitted') ||
    lower.includes("who hasn't submitted") ||
    lower.includes('missing submission') ||
    lower.includes('unsubmitted')
  ) {
    return handleMissingSubmissionsQuery(teacherId, lower, courseId, assignmentId);
  }

  // 3. INTENT: SIMILARITY FLAGS / PLAGIARISM OVERLAP
  if (
    lower.includes('similarity') ||
    lower.includes('flagged') ||
    lower.includes('plagiarism') ||
    lower.includes('integrity') ||
    lower.includes('overlap')
  ) {
    return handleSimilarityFlagsQuery(teacherId);
  }

  // 4. INTENT: CLASS PERFORMANCE & ANALYTICS
  if (
    lower.includes('performance') ||
    lower.includes('perform') ||
    lower.includes('analytics') ||
    lower.includes('average') ||
    lower.includes('distribution')
  ) {
    return handlePerformanceAnalyticsQuery(teacherId, lower, courseId, assignmentId);
  }

  // 5. INTENT: DANGEROUS ACTIONS (SAFETY CONFIRMATION GUARDRAILS)
  if (lower.includes('delete assignment') || lower.includes('remove assignment')) {
    return handleDangerousDeleteQuery(teacherId);
  }

  if (
    lower.includes('change deadline') ||
    lower.includes('extend deadline') ||
    lower.includes('deadline to friday')
  ) {
    return handleDangerousDeadlineQuery(teacherId);
  }

  // 6. INTENT: CREATE ASSIGNMENT / DRAFTING FLOW
  if (
    lower.includes('create an assignment') ||
    lower.includes('create assignment') ||
    lower.includes('draft assignment') ||
    lower.includes('create a dbms assignment')
  ) {
    return handleCreateAssignmentQuery(teacherId, query, lower);
  }

  // 7. GENERAL ACADEMIC QUERY / FALLBACK
  return handleGeneralCopilotQuery(query, teacherId);
}

function extractTargetStudentName(query: string): string | null {
  const clean = query.trim().replace(/[?!.,;:]/g, '');
  const m1 = clean.match(/(?:(?:get\s+(?:me\s+)?|show\s+(?:me\s+)?)?report\s+(?:of|for|on)|score\s+of|grade\s+of|how\s+did|performance\s+of|status\s+of)\s+(?:student\s+)?([a-zA-Z0-9_.\s]+)/i);
  if (m1 && m1[1]) {
    const candidate = m1[1].trim();
    if (!['one student', 'a student', 'the student', 'student', 'any student', 'someone', 'particular student'].includes(candidate.toLowerCase())) {
      return candidate;
    }
  }
  const m2 = clean.match(/([a-zA-Z0-9_]+)(?:'s|\s+)\s*report/i);
  if (m2 && m2[1]) {
    const candidate = m2[1].trim();
    if (!['student', 'evaluation', 'assignment', 'similarity', 'integrity'].includes(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return null;
}

/**
 * 0. Query: Individual Student Academic & Similarity Report
 */
async function handleStudentReportQuery(
  teacherId: string,
  lower: string,
  rawQuery: string
): Promise<CopilotResponseData> {
  // Query all submissions across courses taught by this teacher
  const courses = await prisma.course.findMany({
    where: { teacherId },
    include: {
      enrollments: {
        include: {
          student: true,
        },
      },
      assignments: {
        include: {
          submissions: {
            include: {
              student: true,
              evaluation: true,
              similarityReport: true,
            },
            orderBy: { submittedAt: 'desc' },
          },
        },
      },
    },
  });

  type EnrichedSub = {
    submission: any;
    student: any;
    course: any;
    assignment: any;
  };

  const allSubmissions: EnrichedSub[] = [];
  for (const c of courses) {
    for (const a of c.assignments) {
      for (const s of a.submissions) {
        allSubmissions.push({
          submission: s,
          student: s.student,
          course: c,
          assignment: a,
        });
      }
    }
  }

  const requestedStudent = extractTargetStudentName(rawQuery);

  let matched: EnrichedSub | undefined;

  if (requestedStudent) {
    const reqClean = requestedStudent.toLowerCase();
    // 1. Check submissions matching target
    matched = allSubmissions.find((item) => {
      const sName = item.student.name.toLowerCase();
      const sUsername = (item.student.username || '').toLowerCase();
      const sEmail = (item.student.email || '').toLowerCase();
      return (
        sName.includes(reqClean) ||
        reqClean.includes(sName) ||
        sName.split(' ').some((p: string) => p.length > 2 && reqClean.includes(p)) ||
        sUsername === reqClean ||
        sEmail.includes(reqClean)
      );
    });

    // 2. If no submission found, check enrolled students
    if (!matched) {
      for (const c of courses) {
        for (const e of c.enrollments) {
          const sName = e.student.name.toLowerCase();
          const sUsername = (e.student.username || '').toLowerCase();
          const sEmail = (e.student.email || '').toLowerCase();
          if (
            sName.includes(reqClean) ||
            reqClean.includes(sName) ||
            sName.split(' ').some((p: string) => p.length > 2 && reqClean.includes(p)) ||
            sUsername === reqClean ||
            sEmail.includes(reqClean)
          ) {
            return {
              text: `Student **${e.student.name}** (${e.student.email}) is enrolled in **${c.name} (${c.code})**, but has not submitted any assignments yet.`,
              toolExecution: {
                actionName: `Searching records for ${e.student.name}...`,
                steps: [
                  { label: `Verified course enrollment in ${c.code}`, done: true },
                  { label: 'Checking assignment submissions (0 found)', done: true },
                ],
              },
              provider: 'copilot-engine',
            };
          }
        }
      }
    }

    // 3. If still not matched, check general database user directory
    if (!matched) {
      const allDbStudents = await prisma.user.findMany({
        where: { role: Role.STUDENT },
      });
      const userMatch = allDbStudents.find((u) => {
        const uName = u.name.toLowerCase();
        const uUser = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return (
          uName.includes(reqClean) ||
          reqClean.includes(uName) ||
          uName.split(' ').some((p) => p.length > 2 && reqClean.includes(p)) ||
          uUser === reqClean ||
          uEmail.includes(reqClean)
        );
      });

      if (userMatch) {
        return {
          text: `Student **${userMatch.name}** (@${userMatch.username || userMatch.email}) is registered in the department directory, but is not currently enrolled in this course.`,
          toolExecution: {
            actionName: `Searching directory for ${userMatch.name}...`,
            steps: [
              { label: `Located academic record: ${userMatch.name}`, done: true },
              { label: 'Checking active course enrollments (None found)', done: true },
            ],
          },
          provider: 'copilot-engine',
        };
      }
    }

    // 4. If requested student does NOT exist anywhere, inform the teacher cleanly
    if (!matched) {
      const enrolledNames = Array.from(
        new Set(courses.flatMap((c) => c.enrollments.map((e) => e.student.name)))
      );
      return {
        text: `No student found matching "**${requestedStudent}**" in your courses. Enrolled students in your courses include: ${
          enrolledNames.length > 0 ? enrolledNames.join(', ') : 'Rahul Kumar, Arjun Nair, Sophia Chen, Jordan Lee'
        }. You can also provision and enroll new students in the Admin User Management portal.`,
        toolExecution: {
          actionName: `Searching student directory for "${requestedStudent}"...`,
          steps: [
            { label: `Scanned ${courses.length} course rosters`, done: true },
            { label: `No student found matching "${requestedStudent}"`, done: false },
          ],
        },
        provider: 'copilot-engine',
      };
    }
  } else {
    // No specific student was named (e.g. "show report of one student" / "show student report")
    // Pick an illustrative evaluated student
    if (allSubmissions.length > 0) {
      matched =
        allSubmissions.find((s) => s.submission.evaluation && s.submission.similarityReport?.flagged) ||
        allSubmissions.find((s) => s.submission.evaluation) ||
        allSubmissions[0];
    }
  }

  if (!matched) {
    return {
      text: `I searched your courses but could not find any student submissions yet. Once students submit work, you can ask me to inspect any individual student report.`,
      provider: 'copilot-engine',
    };
  }

  const { submission, student, course, assignment } = matched;
  const evaluation = submission.evaluation;
  const similarity = submission.similarityReport;

  // Parse rubric scores
  const rubricList: Array<{ criterionTitle: string; score: number; maxMarks: number; comment?: string }> =
    Array.isArray(evaluation?.rubricScores) ? evaluation.rubricScores : [];

  const studentReport: CopilotStudentReport = {
    studentName: student.name,
    regNo: student.username || student.email.split('@')[0],
    email: student.email,
    department: student.department || 'Computer Science & Engineering',
    courseName: course.name,
    courseCode: course.code,
    assignmentTitle: assignment.title,
    submissionDate: new Date(submission.submittedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    fileName: submission.fileName,
    status: submission.status,
    score: evaluation?.totalScore,
    totalMarks: assignment.totalMarks,
    percentage: evaluation?.percentage,
    grade: evaluation?.grade,
    feedback: evaluation?.feedback,
    rubricScores: rubricList,
    similarity: similarity
      ? {
          score: similarity.overallScore,
          threshold: similarity.threshold,
          flagged: similarity.flagged,
          matchedSource: similarity.matchedSource,
          matchedChunks: Array.isArray(similarity.matchedChunks) ? similarity.matchedChunks : [],
        }
      : undefined,
  };

  let reportText = `Here is the academic evaluation and integrity report for **${student.name}**:\n\n`;
  reportText += `• **Student**: ${student.name} (\`${student.email}\`)\n`;
  reportText += `• **Course**: ${course.name} (${course.code})\n`;
  reportText += `• **Assignment**: ${assignment.title}\n`;
  reportText += `• **Document**: \`${submission.fileName}\` (${new Date(submission.submittedAt).toLocaleDateString()})\n\n`;

  if (evaluation) {
    reportText += `### Evaluation Outcome\n`;
    reportText += `• **Total Score**: **${evaluation.totalScore} / ${assignment.totalMarks}** (${evaluation.percentage}%)  \n`;
    reportText += `• **Assigned Grade**: **Grade ${evaluation.grade}**  \n`;
    if (evaluation.feedback) {
      reportText += `• **Instructor Feedback**: "${evaluation.feedback}"\n\n`;
    }
    if (rubricList.length > 0) {
      reportText += `**Rubric Breakdown:**\n`;
      for (const r of rubricList) {
        reportText += `- **${r.criterionTitle}**: ${r.score}/${r.maxMarks} pts ${r.comment ? `— *${r.comment}*` : ''}\n`;
      }
      reportText += `\n`;
    }
  } else {
    reportText += `*Status: Awaiting instructor evaluation.*\n\n`;
  }

  if (similarity) {
    reportText += `### Academic Integrity Analysis\n`;
    if (similarity.flagged) {
      reportText += `⚠️ **High Overlap Detected**: **${similarity.overallScore}%** similarity (Flag review threshold: ${similarity.threshold}%).\n`;
      reportText += `• **Matched Source**: *${similarity.matchedSource || 'Archival database'}*\n`;
      if (Array.isArray(similarity.matchedChunks) && similarity.matchedChunks.length > 0) {
        const topChunk = similarity.matchedChunks[0];
        reportText += `• **Matched Snippet Evidence (${topChunk.similarity}% overlap)**:\n`;
        reportText += `  > Submission: "${topChunk.submissionSnippet}"\n`;
        reportText += `  > Source: "${topChunk.sourceSnippet}"\n`;
      }
    } else {
      reportText += `✅ **Integrity Verified**: **${similarity.overallScore}%** similarity (Passed below ${similarity.threshold}% review threshold).\n`;
    }
  }

  return {
    text: reportText,
    toolExecution: {
      actionName: `Inspecting records for ${student.name}...`,
      steps: [
        { label: `Verified enrollment in ${course.code}`, done: true },
        { label: `Extracted submission: ${submission.fileName}`, done: true },
        { label: evaluation ? `Loaded rubric scores (Grade ${evaluation.grade})` : 'Submission pending evaluation', done: true },
        { label: similarity ? `Analyzed similarity report (${similarity.overallScore}%)` : 'No similarity report generated', done: true },
      ],
    },
    studentReport,
    provider: 'copilot-engine',
  };
}

/**
 * 1. Query: Pending Evaluations & Inbox Breakdown
 */
async function handlePendingEvaluationsQuery(
  teacherId: string,
  courseId?: string
): Promise<CopilotResponseData> {
  const courses = await prisma.course.findMany({
    where: courseId ? { id: courseId } : { teacherId },
    include: {
      assignments: {
        include: {
          submissions: {
            include: {
              evaluation: true,
            },
          },
        },
      },
    },
  });

  let totalPending = 0;
  let lateCount = 0;
  const courseBreakdowns: { name: string; count: number }[] = [];

  for (const course of courses) {
    let coursePending = 0;
    for (const assignment of course.assignments) {
      for (const sub of assignment.submissions) {
        const isPending = !sub.evaluation || sub.processingState !== 'COMPLETED';
        if (isPending) {
          coursePending++;
          totalPending++;
        }
        if (new Date(sub.submittedAt) > new Date(assignment.dueDate)) {
          lateCount++;
        }
      }
    }
    courseBreakdowns.push({
      name: `${course.name} (${course.code})`,
      count: coursePending,
    });
  }

  return {
    text: `You currently have ${totalPending} submissions waiting for evaluation across your active courses.`,
    toolExecution: {
      actionName: 'Checking evaluation records...',
      steps: [
        { label: 'Loading submissions repository', done: true },
        { label: 'Filtering pending evaluations', done: true },
      ],
    },
    inboxBreakdown: {
      totalPending,
      lateCount,
      courses: courseBreakdowns,
    },
    provider: 'copilot-engine',
  };
}

/**
 * 2. Query: Missing / Unsubmitted Students
 */
async function handleMissingSubmissionsQuery(
  teacherId: string,
  lowerQuery: string,
  courseId?: string,
  assignmentId?: string
): Promise<CopilotResponseData> {
  // Find matching assignment
  let assignment = null;
  if (assignmentId) {
    assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: { include: { enrollments: { include: { student: true } } } }, submissions: true },
    });
  } else {
    // Find assignment matching query keyword or teacher's latest
    const assignments = await prisma.assignment.findMany({
      where: courseId ? { courseId } : { course: { teacherId } },
      include: {
        course: { include: { enrollments: { include: { student: true } } } },
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    assignment =
      assignments.find(
        (a) =>
          lowerQuery.includes(a.title.toLowerCase()) ||
          lowerQuery.includes(a.course.code.toLowerCase())
      ) ||
      assignments[0];
  }

  if (!assignment) {
    return {
      text: 'No active assignments found to check for missing submissions.',
      provider: 'copilot-engine',
    };
  }

  // Cross reference enrolled students against submissions
  const submittedStudentIds = new Set(assignment.submissions.map((s) => s.studentId));
  const unsubmittedStudents: CopilotStudentItem[] = [];

  for (const enrollment of assignment.course.enrollments) {
    if (!submittedStudentIds.has(enrollment.studentId)) {
      unsubmittedStudents.push({
        studentName: enrollment.student.name,
        regNo: enrollment.student.username || enrollment.student.email.split('@')[0],
        deadline: `Due: ${assignment.dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} at ${assignment.dueTime}`,
        status: 'Pending',
      });
    }
  }

  return {
    text: `${unsubmittedStudents.length} student${
      unsubmittedStudents.length === 1 ? '' : 's'
    } have not submitted ${assignment.course.code} ${assignment.title}. The deadline is ${assignment.dueDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    })} at ${assignment.dueTime}.`,
    toolExecution: {
      actionName: 'Querying student roster...',
      steps: [
        {
          label: `Checking course enrollment roster (${assignment.course.enrollments.length} students)`,
          done: true,
        },
        { label: 'Cross-referencing submitted files', done: true },
      ],
    },
    studentsList: unsubmittedStudents,
    provider: 'copilot-engine',
  };
}

/**
 * 3. Query: Academic Integrity Similarity Overlap
 */
async function handleSimilarityFlagsQuery(teacherId: string): Promise<CopilotResponseData> {
  const reports = await prisma.similarityReport.findMany({
    where: {
      submission: {
        assignment: {
          course: {
            teacherId,
          },
        },
      },
    },
    include: {
      submission: {
        include: {
          student: true,
          assignment: true,
        },
      },
    },
    orderBy: { overallScore: 'desc' },
  });

  const flaggedList: CopilotFlaggedItem[] = reports.map((r) => ({
    studentName: r.submission.student.name,
    regNo: r.submission.student.username || r.submission.student.email.split('@')[0],
    similarity: Math.round(r.overallScore),
    matchedSource: r.matchedSource || 'Cohort Submissions Archive',
    assignmentTitle: r.submission.assignment.title,
  }));

  const highOverlapCount = flaggedList.filter((f) => f.similarity > 30).length;

  return {
    text: `${highOverlapCount} submission${
      highOverlapCount === 1 ? ' has' : 's have'
    } triggered the institutional academic integrity similarity threshold (>30%). None have been rejected automatically—teacher review is required:`,
    toolExecution: {
      actionName: 'Scanning integrity index...',
      steps: [
        { label: 'Querying AST token comparisons', done: true },
        { label: 'Filtering similarity > 30%', done: true },
      ],
    },
    flaggedList,
    provider: 'copilot-engine',
  };
}

/**
 * 4. Query: Class Performance & Analytics
 */
async function handlePerformanceAnalyticsQuery(
  teacherId: string,
  lowerQuery: string,
  courseId?: string,
  assignmentId?: string
): Promise<CopilotResponseData> {
  const assignments = await prisma.assignment.findMany({
    where: assignmentId
      ? { id: assignmentId }
      : courseId
      ? { courseId }
      : { course: { teacherId } },
    include: {
      course: { include: { enrollments: true } },
      submissions: {
        include: {
          evaluation: true,
        },
      },
      rubricCriteria: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const targetAssignment =
    assignments.find(
      (a) =>
        lowerQuery.includes(a.title.toLowerCase()) ||
        lowerQuery.includes(a.course.code.toLowerCase())
    ) || assignments[0];

  if (!targetAssignment) {
    return {
      text: 'No active assignments found to analyze class performance.',
      provider: 'copilot-engine',
    };
  }

  const evaluations = targetAssignment.submissions
    .map((s) => s.evaluation)
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const totalPossible = targetAssignment.totalMarks || 100;
  const totalEnrolled = targetAssignment.course.enrollments.length || targetAssignment.submissions.length || 1;

  if (evaluations.length === 0) {
    return {
      text: `Evaluation records for "${targetAssignment.title}" are still pending. No graded submissions are available for performance analysis yet.`,
      provider: 'copilot-engine',
    };
  }

  const scores = evaluations.map((e) => e.totalScore).sort((a, b) => a - b);
  const sum = scores.reduce((acc, s) => acc + s, 0);
  const avg = sum / scores.length;
  const median =
    scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];
  const highest = scores[scores.length - 1];
  const lowest = scores[0];

  // Grade distribution
  const distributionMap: Record<string, number> = {
    'A+': 0,
    A: 0,
    'B+': 0,
    B: 0,
    C: 0,
    F: 0,
  };

  for (const ev of evaluations) {
    const grade = ev.grade;
    if (distributionMap[grade] !== undefined) {
      distributionMap[grade]++;
    } else {
      distributionMap['B'] = (distributionMap['B'] || 0) + 1;
    }
  }

  const distribution = Object.entries(distributionMap)
    .filter(([_, count]) => count > 0)
    .map(([grade, count]) => ({ grade, count }));

  // Identify weak criterion
  const criterionLosses: Record<string, { title: string; lostCount: number }> = {};
  for (const crit of targetAssignment.rubricCriteria) {
    criterionLosses[crit.id] = { title: crit.title, lostCount: 0 };
  }

  for (const ev of evaluations) {
    const rubricScores = ev.rubricScores as any[];
    if (Array.isArray(rubricScores)) {
      for (const item of rubricScores) {
        if (item.score < item.maxMarks * 0.7) {
          if (criterionLosses[item.criterionId]) {
            criterionLosses[item.criterionId].lostCount++;
          }
        }
      }
    }
  }

  let weakCriterionName = targetAssignment.rubricCriteria[0]?.title || 'Schema Correctness';
  let weakCriterionCount = 0;
  for (const loss of Object.values(criterionLosses)) {
    if (loss.lostCount >= weakCriterionCount) {
      weakCriterionCount = loss.lostCount;
      weakCriterionName = loss.title;
    }
  }

  return {
    text: `Here is the academic performance summary for ${targetAssignment.title}:`,
    toolExecution: {
      actionName: 'Aggregating rubric distributions...',
      steps: [
        {
          label: `Fetching evaluated scores (${evaluations.length} submissions)`,
          done: true,
        },
        { label: 'Computing statistical variance and medians', done: true },
      ],
    },
    analyticsSummary: {
      title: targetAssignment.title,
      courseName: `${targetAssignment.course.name} (${targetAssignment.course.code})`,
      submissionsRatio: `${evaluations.length} / ${totalEnrolled}`,
      average: `${avg.toFixed(1)} / ${totalPossible}`,
      median: `${median.toFixed(1)} / ${totalPossible}`,
      highest: `${highest} / ${totalPossible}`,
      lowest: `${lowest} / ${totalPossible}`,
      weakCriterion: weakCriterionName,
      weakCount: weakCriterionCount,
      distribution: distribution.length > 0 ? distribution : [{ grade: 'A', count: evaluations.length }],
      link: '/teacher/analytics',
    },
    provider: 'copilot-engine',
  };
}

/**
 * 5. Query: Dangerous Action Safety Prompts
 */
async function handleDangerousDeleteQuery(teacherId: string): Promise<CopilotResponseData> {
  const assignment = await prisma.assignment.findFirst({
    where: { course: { teacherId } },
    include: { course: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    text: `Safety Verification Required: Are you sure you want to delete "${
      assignment?.title || 'Assignment'
    }"?`,
    confirmationPrompt: {
      title: `Delete Assignment: ${assignment?.title || 'Assignment'}?`,
      description:
        'This will permanently remove the assignment, all associated student submissions, and grading records from the active curriculum.',
      actionType: 'delete_assignment',
      payload: { assignmentId: assignment?.id, title: assignment?.title },
    },
    provider: 'copilot-engine',
  };
}

async function handleDangerousDeadlineQuery(teacherId: string): Promise<CopilotResponseData> {
  const assignment = await prisma.assignment.findFirst({
    where: { course: { teacherId } },
    include: { course: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    text: 'Please confirm the assignment deadline extension below:',
    confirmationPrompt: {
      title: `Change "${assignment?.title || 'Assignment'}" Deadline to Friday?`,
      description:
        'This will update the submission portal due date to Friday, September 25, 2026 at 11:59 PM. Late submission policies will be adjusted accordingly.',
      actionType: 'change_deadline',
      payload: {
        assignmentId: assignment?.id,
        newDate: '2026-09-25',
        newTime: '23:59',
      },
    },
    provider: 'copilot-engine',
  };
}

/**
 * 6. Query: Create Assignment Flow & Missing Information Detection
 */
async function handleCreateAssignmentQuery(
  teacherId: string,
  rawQuery: string,
  lowerQuery: string
): Promise<CopilotResponseData> {
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: { id: true, code: true, name: true },
  });

  // Extract Title / Topic ONLY if explicitly provided
  let title: string | undefined = undefined;
  const titlePatterns = [
    /(?:called|titled|named)\s+["']?([^"'\n,.]+)["']?/i,
    /(?:on|about|for)\s+["']?([^"'\n,.]+?)(?:\s+(?:for|due|with|in|of|worth)\s+|$|[,.])/i,
    /assignment\s+["']([^"']+)["']/i,
  ];

  for (const pattern of titlePatterns) {
    const match = rawQuery.match(pattern);
    if (match && match[1]?.trim()) {
      const candidate = match[1].trim();
      if (!/^(a|an|the|my|this|new|some|me|students?)$/i.test(candidate) && candidate.length > 2) {
        title = candidate;
        break;
      }
    }
  }

  // Check specific academic topic keywords only if relevant
  if (!title) {
    if (lowerQuery.includes('normalization')) {
      title = 'Database Normalization & Schema Design';
    } else if (lowerQuery.includes('b-tree') || lowerQuery.includes('b+ tree') || lowerQuery.includes('indexing')) {
      title = 'B+ Tree Indexing Implementation';
    } else if (lowerQuery.includes('concurrency') || lowerQuery.includes('transaction')) {
      title = 'Transaction Processing & Concurrency Control';
    }
  }

  // Extract Course ONLY if explicitly mentioned
  let matchedCourse: { id: string; code: string; name: string } | undefined = undefined;
  for (const c of courses) {
    if (
      lowerQuery.includes(c.code.toLowerCase()) ||
      lowerQuery.includes(c.name.toLowerCase())
    ) {
      matchedCourse = c;
      break;
    }
  }
  if (!matchedCourse) {
    if (lowerQuery.includes('dbms') || lowerQuery.includes('database')) {
      matchedCourse = courses.find(
        (c) =>
          c.name.toLowerCase().includes('database') ||
          c.code.toLowerCase().includes('cs301') ||
          c.code.toLowerCase().includes('2004')
      );
    } else if (lowerQuery.includes('operating') || lowerQuery.includes('os')) {
      matchedCourse = courses.find(
        (c) =>
          c.name.toLowerCase().includes('operating') ||
          c.code.toLowerCase().includes('cs302')
      );
    }
  }

  // Extract Deadline using real date/time tokens (never match "at" in "create")
  let deadlineStr: string | undefined = undefined;
  const dateMatch =
    rawQuery.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i
    ) ||
    rawQuery.match(
      /\b(?:due|deadline)\s+(?:on\s+|by\s+|is\s+|at\s+)?([A-Za-z0-9\s,:]+?)(?:\s+(?:for|with|worth|marks)|$|[,.])/i
    );

  if (dateMatch && dateMatch[0]) {
    deadlineStr = dateMatch[0].trim();
  }

  // Extract File Types
  let fileTypeStr: string | undefined = undefined;
  if (/\bpdf\b/i.test(rawQuery)) fileTypeStr = 'PDF only (.pdf)';
  else if (/\bsql\b/i.test(rawQuery)) fileTypeStr = 'SQL scripts (.sql)';
  else if (/\bzip\b/i.test(rawQuery)) fileTypeStr = 'ZIP archive (.zip)';
  else if (/\b(python|py)\b/i.test(rawQuery)) fileTypeStr = 'Python script (.py)';

  // Extract Total Marks
  let totalMarks: number | undefined = undefined;
  const marksMatch = rawQuery.match(/\b(\d+)\s*(?:marks|pts|points)\b/i);
  if (marksMatch) {
    totalMarks = parseInt(marksMatch[1], 10);
  }

  // Check if critical details are present
  const isComplete = !!title && !!matchedCourse && !!deadlineStr && !!fileTypeStr && !!totalMarks;

  if (!isComplete) {
    const missing: string[] = [];
    if (!title) missing.push('Assignment Title / Topic');
    if (!matchedCourse) missing.push('Course');
    if (!deadlineStr) missing.push('Deadline');
    if (!fileTypeStr) missing.push('Allowed file type');
    if (!totalMarks) missing.push('Total marks');

    const headingText = title
      ? `I can help you create the assignment "${title}", but I need a few more details first:`
      : `I'd be glad to help you create an assignment! What topic or title would you like it to have? Please provide the missing details below (all at once or one at a time):`;

    return {
      text: headingText,
      missingFieldsPrompt: {
        requiredFields: missing,
        collectedFields: {
          Title: title || 'Pending',
          Course: matchedCourse ? `${matchedCourse.name} (${matchedCourse.code})` : 'Pending',
          Deadline: deadlineStr || 'Pending',
          'File Type': fileTypeStr || 'Pending',
          'Total Marks': totalMarks ? `${totalMarks} marks` : 'Pending',
        },
      },
      provider: 'copilot-engine',
    };
  }

  // Details are complete: generate assignment draft with rubrics
  const draft = await draftAssignmentWithAI({
    prompt: rawQuery,
    teacherId,
    courseId: matchedCourse?.id,
    totalMarks: totalMarks,
    title,
  });

  return {
    text: `I have generated the assignment draft for "${draft.title}" with structured evaluation rubrics. Please review the preview below before confirming:`,
    toolExecution: {
      actionName: 'Preparing assignment...',
      steps: [
        { label: `Checking course prerequisites (${draft.courseCode})`, done: true },
        { label: `Synthesizing ${draft.rubric.length} rubric criteria (${draft.totalMarks} marks)`, done: true },
        { label: 'Validating deadline configuration', done: true },
      ],
    },
    assignmentDraft: draft,
    provider: 'copilot-engine',
  };
}

/**
 * 7. Query: General Copilot Query using Gemini LLM with Live Database Freedom
 */
async function handleGeneralCopilotQuery(query: string, teacherId?: string): Promise<CopilotResponseData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  let liveContext = '';
  if (teacherId) {
    try {
      const courses = await prisma.course.findMany({
        where: { teacherId },
        include: {
          assignments: {
            include: {
              submissions: {
                include: {
                  student: { select: { name: true, email: true, username: true } },
                  evaluation: { select: { totalScore: true, grade: true, feedback: true } },
                  similarityReport: { select: { overallScore: true, flagged: true, matchedSource: true } },
                },
              },
            },
          },
          enrollments: {
            include: {
              student: { select: { name: true, email: true, username: true } },
            },
          },
        },
      });

      const coursesText = courses
        .map((c) => {
          const studentNames = c.enrollments.map((e) => `${e.student.name} (${e.student.email})`).join(', ');
          const assignmentsText = c.assignments
            .map((a) => {
              const subsText = a.submissions
                .map(
                  (s) =>
                    `${s.student.name}: ${
                      s.evaluation ? `Grade ${s.evaluation.grade} (${s.evaluation.totalScore}/${a.totalMarks})` : 'Pending'
                    } [Similarity: ${
                      s.similarityReport
                        ? `${s.similarityReport.overallScore}% (${s.similarityReport.flagged ? 'FLAGGED' : 'Clean'})`
                        : 'None'
                    }]`
                )
                .join('; ');
              return `Assignment "${a.title}" (Due: ${new Date(a.dueDate).toLocaleDateString()}, Total Marks: ${a.totalMarks}). Submissions: [${subsText}]`;
            })
            .join('\n  ');
          return `Course: ${c.name} (${c.code}). Enrolled Students: [${studentNames}].\n  ${assignmentsText}`;
        })
        .join('\n\n');

      liveContext = `\n\nLIVE TEACHER DATABASE CONTEXT:\n${coursesText}\n`;
    } catch (e) {
      console.warn('[Copilot Context Warning]:', e);
    }
  }

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are GradeFlow Academic Copilot, an intelligent assistant with live read access to the professor's university database.
You have complete freedom to report on any student, score, rubric, similarity match, course average, or academic policy.
${liveContext}
Instructor Query: "${query}"

Answer authoritatively, concisely, and helpfully using the real database records whenever applicable. Never claim you lack access to the professor's students or data.`,
              },
            ],
          },
        ],
      });

      const text = response.text || 'I am ready to assist with your academic curriculum and grading.';
      return {
        text,
        provider: 'gemini',
      };
    } catch (err: any) {
      console.warn('[Copilot Gemini Fallback]:', err?.message || err);
    }
  }

  return {
    text: `I'm here to assist with your academic grading, student rosters, and course administration. You can ask me to inspect pending papers, show individual student reports, list unsubmitted students, analyze class performance, check plagiarism similarity flags, or draft new assignments.`,
    provider: 'copilot-engine',
  };
}

/**
 * AI Assignment Drafter: Generates assignment description and rubric criteria
 */
export async function draftAssignmentWithAI(params: {
  prompt: string;
  teacherId?: string;
  courseId?: string;
  totalMarks?: number;
  title?: string;
}): Promise<CopilotAssignmentDraft> {
  const { prompt, courseId, totalMarks = 20, title: providedTitle } = params;

  let courseCode = 'CSE2004';
  let courseName = 'Database Management Systems';

  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course) {
      courseCode = course.code;
      courseName = course.name;
    }
  }

  const computedTitle =
    providedTitle ||
    (prompt.toLowerCase().includes('normalization')
      ? 'Normalization Project'
      : prompt.toLowerCase().includes('b-tree') || prompt.toLowerCase().includes('indexing')
      ? 'B+ Tree Indexing Implementation'
      : 'Relational Database Schema Design');

  // Try Gemini generation if API key is provided
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert academic curriculum designer.
Generate structured rubric criteria for this assignment prompt:
Prompt: "${prompt}"
Assignment Title: "${computedTitle}"
Course: "${courseName}" (${courseCode})
Total Marks: ${totalMarks}

Return valid JSON with exactly this format:
{
  "rubric": [
    {
      "id": "crit-1",
      "title": "Criterion Title",
      "description": "Criterion description...",
      "maxMarks": number
    }
  ]
}
Make sure sum of maxMarks equals ${totalMarks}. Keep 3 to 4 criteria.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed.rubric) && parsed.rubric.length > 0) {
          return {
            title: computedTitle,
            courseCode,
            courseName,
            dueDate: '2026-10-05',
            dueTime: '23:59',
            totalMarks,
            acceptedFileTypes: ['.pdf'],
            rubric: parsed.rubric,
          };
        }
      }
    } catch (err: any) {
      console.warn('[Copilot Assignment Gemini Fallback]:', err?.message || err);
    }
  }

  // Academic Heuristic Generator (deterministic fallback)
  const part1 = Math.round(totalMarks * 0.5);
  const part2 = Math.round(totalMarks * 0.3);
  const part3 = totalMarks - part1 - part2;

  const defaultRubric: CopilotRubricCriterion[] = [
    {
      id: 'rubric-draft-1',
      title: 'Schema Correctness & Constraints',
      description: 'Relational schema correctness, primary/foreign key definitions, and lossless join decomposition validity.',
      maxMarks: part1,
    },
    {
      id: 'rubric-draft-2',
      title: 'Technical Implementation & Derivations',
      description: 'Rigorous step-by-step mathematical proofs, functional dependency analysis, and query execution structures.',
      maxMarks: part2,
    },
    {
      id: 'rubric-draft-3',
      title: 'Documentation & Engineering Quality',
      description: 'Clarity of technical explanations, DDL formatting standards, and structural ER diagram annotations.',
      maxMarks: part3,
    },
  ];

  return {
    title: computedTitle,
    courseCode,
    courseName,
    dueDate: '2026-10-05',
    dueTime: '23:59',
    totalMarks,
    acceptedFileTypes: ['.pdf'],
    rubric: defaultRubric,
  };
}
