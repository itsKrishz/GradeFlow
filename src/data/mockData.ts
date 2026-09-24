import { Course, Assignment, Submission, User, Activity, EnrolledStudent, AppNotification } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Prof. Teacher',
    username: 'teacher1',
    email: 'teacher1@gradeflow.edu',
    role: 'teacher',
    title: 'Associate Professor',
    department: 'Computer Science & Engineering',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-3',
    name: 'Dr. Arvind Mehta',
    username: 'admin',
    email: 'admin@gradeflow.edu',
    role: 'admin',
    title: 'Dean of Academics & Systems',
    department: 'Academic Affairs',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-stu-bhadra',
    name: 'Bhadra K.',
    username: 'bhadra',
    email: 'bhadra.k@student.edu',
    role: 'student',
    title: 'Undergraduate Student',
    department: 'Computer Science & Engineering',
    regNo: 'CSE-2024-015',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-stu-nevin',
    name: 'Nevin P.',
    username: 'nevin',
    email: 'nevin.p@student.edu',
    role: 'student',
    title: 'Undergraduate Student',
    department: 'Computer Science & Engineering',
    regNo: 'CSE-2024-016',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export const mockCourses: Course[] = [];

export const mockAssignments: Assignment[] = [];

export const mockSubmissions: Submission[] = [];

export const mockRecentActivity: Activity[] = [];

export const mockEnrolledStudents: EnrolledStudent[] = [];

export const mockFeedbackTemplates = [
  {
    title: 'Good Work',
    text: 'Good understanding of core principles. The implementation is clean, logically organized, and satisfies the assignment requirements effectively.'
  },
  {
    title: 'Needs Improvement',
    text: 'The submission addresses the primary goals but requires substantial refinement in structure and completeness. Please review the rubric criteria carefully.'
  },
  {
    title: 'Excellent Documentation',
    text: 'Exceptional documentation and clarity of thought. The technical justifications, schemas, and diagrams are thorough, professional, and well-annotated.'
  },
  {
    title: 'Improve Code Quality',
    text: 'The theoretical approach is sound, but the code implementation would benefit from adhering to formatting conventions, modularity, and error handling.'
  },
  {
    title: 'Late Submission',
    text: 'Assignment was submitted past the scheduled deadline. Note that policy deductions may apply as outlined in the course syllabus.'
  }
];

export const mockNotifications: AppNotification[] = [];

export const mockUnsubmittedStudents: any[] = [];

export const mockSimilarityComparison = {
  studentName: 'Student Submission',
  regNo: 'N/A',
  similarityScore: 0,
  flagThreshold: 30,
  assignmentTitle: 'Assignment',
  matchedSource: 'Institutional Submissions Archive',
  matchedSourceType: 'Prior Student Submission Archive',
  secondarySource: 'External Repository Reference',
  secondarySimilarity: 0,
  matchedSegments: [] as { section: string; studentText: string; sourceText: string; similarity: number }[]
};
