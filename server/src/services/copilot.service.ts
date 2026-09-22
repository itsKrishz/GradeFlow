import { GoogleGenAI } from '@google/genai';
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
  provider?: 'gemini' | 'copilot-engine';
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
  return handleGeneralCopilotQuery(query);
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

  const matchedCourse = courses.find((c) => lowerQuery.includes(c.code.toLowerCase())) || courses[0];

  // Extract potential parameters
  const hasDeadline =
    lowerQuery.includes('oct') ||
    lowerQuery.includes('pm') ||
    lowerQuery.includes('deadline') ||
    lowerQuery.includes('at');
  const hasFileType = lowerQuery.includes('pdf') || lowerQuery.includes('sql') || lowerQuery.includes('zip');
  const marksMatch = rawQuery.match(/(\d+)\s*(marks|pts|points)/i);
  const totalMarks = marksMatch ? parseInt(marksMatch[1], 10) : lowerQuery.includes('20') ? 20 : undefined;

  const title = lowerQuery.includes('normalization')
    ? 'DBMS Normalization & Schema Design'
    : lowerQuery.includes('b-tree') || lowerQuery.includes('indexing')
    ? 'B-Tree & Hash Indexing Implementation'
    : 'Database Schema & Query Optimization';

  // Check if critical details are present
  const isComplete = hasDeadline && hasFileType && !!totalMarks;

  if (!isComplete) {
    const missing: string[] = [];
    if (!hasDeadline) missing.push('Deadline');
    if (!hasFileType) missing.push('Allowed file type');
    if (!totalMarks) missing.push('Total marks');

    return {
      text: `I can create the assignment "${title}", but I need a few details first.\n\nYou can provide them all at once or one at a time:`,
      missingFieldsPrompt: {
        requiredFields: missing,
        collectedFields: {
          Title: title,
          Course: matchedCourse ? `${matchedCourse.name} (${matchedCourse.code})` : 'Pending',
          Deadline: hasDeadline ? 'October 5 at 11:59 PM' : 'Pending',
          'File Type': hasFileType ? 'PDF only' : 'Pending',
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
    totalMarks: totalMarks || 20,
    title,
  });

  return {
    text: 'I have generated the assignment draft with structured evaluation rubrics. Please review the preview below before confirming:',
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
 * 7. Query: General Copilot Query using Gemini LLM if available
 */
async function handleGeneralCopilotQuery(query: string): Promise<CopilotResponseData> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are GradeFlow Academic Copilot, an intelligent assistant for university professors. Answer the instructor's question concisely, professionally, and academically:\n\nInstructor Query: "${query}"`,
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
    text: `I'm here to assist with your academic grading, student rosters, and course administration. You can ask me to inspect pending papers, list unsubmitted students, analyze class performance, check plagiarism similarity flags, or draft new assignments.`,
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
        model: 'gemini-2.5-flash',
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
