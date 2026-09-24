export type Role = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  title?: string;
  department?: string;
  regNo?: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  section: string;
  semester: string;
  academicYear: string;
  studentsCount: number;
  activeAssignmentsCount: number;
  enrollmentCode: string;
  description?: string;
  teacherName?: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  allowLate: boolean;
  maxSubmissions: number;
  acceptedFileTypes: string[];
  rubric: RubricCriterion[];
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  lateCount: number;
  evaluatedCount: number;
  status: 'Active' | 'Draft' | 'Archived';
}

export type SubmissionStatus = 'Submitted' | 'Late' | 'Missing';
export type EvaluationStatus = 'Pending' | 'Evaluated' | 'Flagged';

export interface MatchedSection {
  sectionTitle: string;
  similarityPercentage: number;
  matchedSource: string;
  matchedSnippet: string;
  matchedSubmissionId?: string;
  matchedStudentName?: string;
  matchedFileName?: string;
}

export interface SimilarityReport {
  overallScore: number;
  threshold: number;
  flagged: boolean;
  matchedSections: MatchedSection[];
}

export interface Evaluation {
  id: string;
  submissionId: string;
  rubricScores: Record<string, number>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback: string;
  aiAssisted: boolean;
  status: 'Draft' | 'Final';
  evaluatedAt: string;
}

export interface DocumentPage {
  pageNumber: number;
  title: string;
  content: string;
  codeSnippet?: string;
}

export type ProcessingState = 'extracted' | 'analyzing_similarity' | 'ai_evaluating' | 'completed' | 'failed';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  regNo: string;
  studentEmail: string;
  submittedAt: string;
  status: SubmissionStatus;
  evaluationStatus: EvaluationStatus;
  similarityScore: number;
  similarityReport: SimilarityReport;
  fileName: string;
  fileSize: string;
  pages: DocumentPage[];
  evaluation?: Evaluation;
  processingState?: ProcessingState;
  processingStep?: number; // 1 to 4
  aiSuggestedScore?: number;
  aiSuggestedRubric?: Record<string, number>;
  aiReasoning?: string | Record<string, string>;
  aiSuggestedFeedback?: string;
  fileHash?: string;
  fileBytes?: number;
  extractedText?: string;
  fileUrl?: string;
  pdfStorageKey?: string;
}

export interface SubmissionPipelineResult {
  submissionId: string;
  wordCount: number;
  fileHash: string;
  similarityScore: number;
  isFlagged: boolean;
  matchedPeerName?: string;
  matchedReason?: string;
  aiSuggestedScore: number;
  totalMarks: number;
  aiSuggestedRubric: Record<string, number>;
  aiReasoning: Record<string, string>;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timeAgo: string;
  type: 'submission' | 'evaluation' | 'assignment' | 'similarity';
}

export interface EnrolledStudent {
  id: string;
  name: string;
  regNo: string;
  email: string;
  courseId: string;
  enrollmentStatus: 'Active' | 'Inactive';
  averageGrade: string;
  submittedAssignments: number;
  totalAssignments: number;
}

export interface AppNotification {
  id: string;
  type: 'submission' | 'evaluation' | 'integrity' | 'deadline';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string;
  actionText?: string;
  badge?: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolExecution?: {
    actionName: string;
    steps: { label: string; done: boolean }[];
  };
  missingFieldsPrompt?: {
    requiredFields: string[];
    collectedFields: Record<string, any>;
  };
  confirmationPrompt?: {
    title: string;
    description: string;
    actionType: 'delete_assignment' | 'delete_course' | 'change_deadline' | 'modify_grade';
    payload: any;
  };
  assignmentDraft?: {
    title: string;
    courseCode: string;
    courseName: string;
    dueDate: string;
    dueTime: string;
    totalMarks: number;
    acceptedFileTypes: string[];
    rubric: RubricCriterion[];
  };
  studentsList?: {
    studentName: string;
    regNo: string;
    deadline: string;
    status: string;
  }[];
  flaggedList?: {
    studentName: string;
    regNo: string;
    similarity: number;
    matchedSource: string;
    assignmentTitle: string;
  }[];
  analyticsSummary?: {
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
  };
  inboxBreakdown?: {
    totalPending: number;
    lateCount: number;
    courses: { name: string; count: number }[];
  };
  studentReport?: CopilotStudentReport;
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

