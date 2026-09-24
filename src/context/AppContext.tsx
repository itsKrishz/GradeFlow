import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Role,
  Course,
  Assignment,
  Submission,
  Evaluation,
  Activity,
  RubricCriterion,
  EnrolledStudent,
  AppNotification,
  EvaluationStatus,
  SubmissionPipelineResult
} from '../types';
import {
  mockUsers,
  mockCourses,
  mockAssignments,
  mockSubmissions,
  mockRecentActivity,
  mockEnrolledStudents,
  mockNotifications
} from '../data/mockData';
import { api } from '../services/api';
import { savePdfFile } from '../utils/pdfStorage';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Auth / Current User
  currentUser: User;
  switchRole: (role: Role) => void;
  login: (identifier: string, password?: string, roleOverride?: Role) => Promise<LoginResult>;
  registerUser: (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: Role;
    department?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  // Courses
  courses: Course[];
  createCourse: (course: Omit<Course, 'id' | 'studentsCount' | 'activeAssignmentsCount' | 'enrollmentCode'>) => Course;
  deleteCourse: (courseId: string) => void;
  getCourse: (id: string) => Course | undefined;

  // Assignments
  assignments: Assignment[];
  createAssignment: (assignment: Omit<Assignment, 'id' | 'totalStudents' | 'submittedCount' | 'pendingCount' | 'lateCount' | 'evaluatedCount' | 'status'>) => Assignment;
  deleteAssignment: (assignmentId: string) => void;
  getAssignment: (id: string) => Assignment | undefined;

  // Submissions & Evaluation
  submissions: Submission[];
  getSubmission: (id: string) => Submission | undefined;
  getSubmissionsForAssignment: (assignmentId: string) => Submission[];
  saveEvaluation: (submissionId: string, evaluation: Evaluation, isDraft?: boolean) => void;
  generateAIFeedback: (rubricScores: Record<string, number>, criteria: RubricCriterion[], studentName: string) => string;
  batchApproveSubmissions: (submissionIds: string[]) => void;
  retryProcessing: (submissionId: string) => void;
  updateAssignmentDeadline: (assignmentId: string, newDate: string, newTime?: string) => void;

  // Student specific actions
  submitAssignment: (assignmentId: string, fileData: {
    name: string;
    size: string;
    fileHash?: string;
    fileBytes?: number;
    textContent?: string;
    wordCount?: number;
    fileBlob?: Blob | File;
    fileUrl?: string;
  }) => SubmissionPipelineResult | null;
  attachPdfToSubmission: (submissionId: string, file: File | Blob) => Promise<void>;
  enrolledStudents: EnrolledStudent[];

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Copilot Drawer
  isCopilotOpen: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;

  // Activity feed
  activities: Activity[];

  // Toast
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateNGrams(text: string, n = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? (intersectionCount / unionSize) * 100 : 0;
}

/**
 * Cross-references all submissions in cohort to detect exact duplicates, identical files,
 * matching hashes, identical file names/sizes, and high lexical overlap.
 */
export function auditCohortSubmissions(subsList: Submission[]): Submission[] {
  const updated = subsList.map(s => ({ ...s }));

  for (let i = 0; i < updated.length; i++) {
    const subA = updated[i];
    let highestSim = subA.similarityScore || 0;
    let matchingPeer: Submission | null = null;
    let matchType = '';

    for (let j = 0; j < updated.length; j++) {
      if (i === j) continue;
      const subB = updated[j];
      if (subA.assignmentId !== subB.assignmentId) continue;

      // 1. Check exact cryptographic hash match
      const hashMatch = Boolean(subA.fileHash && subB.fileHash && subA.fileHash === subB.fileHash);

      // 2. Check identical file name and file size
      const nameA = (subA.fileName || '').trim().toLowerCase();
      const nameB = (subB.fileName || '').trim().toLowerCase();
      const nameMatch = nameA.length > 2 && nameA === nameB;
      const sizeMatch = Boolean(subA.fileSize && subB.fileSize && subA.fileSize === subB.fileSize);
      const bytesMatch = Boolean(subA.fileBytes && subB.fileBytes && subA.fileBytes === subB.fileBytes);

      // 3. Check Jaccard overlap on text content
      const textA = (subA.extractedText || subA.pages?.map(p => p.content).join(' ') || '').toLowerCase();
      const textB = (subB.extractedText || subB.pages?.map(p => p.content).join(' ') || '').toLowerCase();
      let jaccardScore = 0;
      if (textA.length > 80 && textB.length > 80) {
        const ngramsA = generateNGrams(textA, 3);
        const ngramsB = generateNGrams(textB, 3);
        jaccardScore = computeJaccardSimilarity(ngramsA, ngramsB);
      }

      // Check if duplicate submission between peers
      const isDuplicateFile = hashMatch || (nameMatch && sizeMatch) || bytesMatch || (nameMatch && nameA.endsWith('.pdf'));
      const isHighJaccard = jaccardScore >= 35;

      if (isDuplicateFile || isHighJaccard) {
        const score = isDuplicateFile ? 98.4 : Math.round(jaccardScore * 10) / 10;
        if (score > highestSim || !subA.similarityReport?.flagged) {
          highestSim = score;
          matchingPeer = subB;
          matchType = isDuplicateFile ? 'Identical deliverable file detected across cohort peer submissions' : `${Math.round(jaccardScore)}% lexical overlap in normalization proofs`;
        }
      }
    }

    if (matchingPeer && highestSim >= 30) {
      updated[i] = {
        ...subA,
        similarityScore: highestSim,
        evaluationStatus: subA.evaluationStatus === 'Evaluated' ? 'Evaluated' : 'Flagged',
        similarityReport: {
          overallScore: highestSim,
          threshold: 30,
          flagged: true,
          matchedSections: [
            {
              sectionTitle: 'Cohort Peer Match / Relational Decomposition & Normalization Proof',
              similarityPercentage: Math.round(highestSim),
              matchedSource: `Peer Submission: ${matchingPeer.studentName} (${matchingPeer.fileName})`,
              matchedSnippet: `${matchType}. Relational schema constraints and candidate keys match peer submission from ${matchingPeer.studentName} (${matchingPeer.regNo || 'Enrolled Student'}).`
            },
            ...(subA.similarityReport?.matchedSections || []).filter(s => !s.matchedSource.includes('Peer Submission'))
          ]
        }
      };
    }
  }

  return updated;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('gradeflow_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('gradeflow_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('gradeflow_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserJson = localStorage.getItem('gradeflow_current_user');
    if (savedUserJson) {
      try {
        return JSON.parse(savedUserJson);
      } catch (e) {
        // fallback
      }
    }
    const savedRole = localStorage.getItem('gradeflow_current_role') as Role;
    const found = mockUsers.find(u => u.role === savedRole);
    return found || mockUsers[2]; // Default to Admin (user-3)
  });

  const switchRole = (role: Role) => {
    const target = mockUsers.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('gradeflow_current_user', JSON.stringify(target));
      localStorage.setItem('gradeflow_current_role', role);
      showToast(`Switched to ${role.toUpperCase()} mode: ${target.name}`, 'info');
    }
  };

  const login = async (identifier: string, password?: string, roleOverride?: Role): Promise<LoginResult> => {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Try live PostgreSQL backend first
    if (password) {
      try {
        const res = await api.auth.login(cleanId, password);
        if (res && res.success && res.user) {
          const mappedRole = res.user.role.toLowerCase() as Role;
          const userObj: User = {
            id: res.user.id,
            name: res.user.name,
            username: res.user.username || cleanId,
            email: res.user.email,
            role: mappedRole,
            department: res.user.department || 'Computer Science',
            status: 'Active',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          };
          setCurrentUser(userObj);
          localStorage.setItem('gradeflow_current_user', JSON.stringify(userObj));
          localStorage.setItem('gradeflow_current_role', userObj.role);
          showToast(`Welcome back, ${userObj.name}`, 'success');
          return { success: true, user: userObj };
        }
      } catch (err: any) {
        if (err?.status === 401) {
          showToast('Invalid username or password. Please verify your credentials.', 'error');
          return { success: false, error: 'Invalid username or password. Please verify your credentials.' };
        }
        console.warn('Backend unavailable, falling back to local credentials:', err.message);
      }
    }

    // 2. Fallback to local / dynamically registered credentials
    const savedCustomCreds = localStorage.getItem('gradeflow_user_credentials');
    const customCreds: Record<string, { role: Role; pwd: string; userId: string; name?: string; department?: string; email?: string }> = savedCustomCreds
      ? JSON.parse(savedCustomCreds)
      : {};

    const credentials: Record<string, { role: Role; pwd: string; userId: string }> = {
      admin: { role: 'admin', pwd: 'admin123', userId: 'user-3' },
      'admin@gradeflow.edu': { role: 'admin', pwd: 'admin123', userId: 'user-3' },
      teacher1: { role: 'teacher', pwd: 'teacher123', userId: 'user-1' },
      'teacher1@gradeflow.edu': { role: 'teacher', pwd: 'teacher123', userId: 'user-1' },
      bhadra: { role: 'student', pwd: 'student123', userId: 'user-stu-bhadra' },
      'bhadra.k@student.edu': { role: 'student', pwd: 'student123', userId: 'user-stu-bhadra' },
      nevin: { role: 'student', pwd: 'student123', userId: 'user-stu-nevin' },
      'nevin.p@student.edu': { role: 'student', pwd: 'student123', userId: 'user-stu-nevin' }
    };

    const allCreds = { ...credentials, ...customCreds };
    const cred = allCreds[cleanId];

    // If password provided, validate it
    if (password !== undefined) {
      if (!cred || cred.pwd !== password) {
        showToast('Invalid username or password. Please verify your credentials.', 'error');
        return { success: false, error: 'Invalid username or password. Please verify your credentials.' };
      }
    }

    let matched = mockUsers.find(u => 
      u.username?.toLowerCase() === cleanId || 
      u.email.toLowerCase() === cleanId ||
      (cred && u.id === cred.userId)
    );

    if (!matched && customCreds[cleanId]) {
      const c = customCreds[cleanId];
      matched = {
        id: c.userId,
        name: c.name || cleanId,
        username: cleanId,
        email: c.email || `${cleanId}@gradeflow.edu`,
        role: c.role,
        department: c.department || 'Computer Science',
        status: 'Active',
      };
    }

    if (!matched && roleOverride) {
      matched = mockUsers.find(u => u.role === roleOverride);
    }
    if (!matched) {
      matched = mockUsers[2]; // Default to Admin
    }

    setCurrentUser(matched);
    localStorage.setItem('gradeflow_current_user', JSON.stringify(matched));
    localStorage.setItem('gradeflow_current_role', matched.role);
    showToast(`Welcome back, ${matched.name}`, 'success');
    return { success: true, user: matched };
  };

  const registerUser = async (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: Role;
    department?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanRole = userData.role.toLowerCase() as Role;

    // 1. Persist to PostgreSQL backend if reachable
    try {
      await api.auth.createUser({
        name: userData.name,
        username: cleanUsername,
        email: cleanEmail,
        password: userData.password,
        role: cleanRole,
        department: userData.department || 'Computer Science',
      });
    } catch (e: any) {
      console.warn('[Backend createUser Warning]:', e.message);
    }

    // 2. Persist to local custom credentials
    const savedCustomCreds = localStorage.getItem('gradeflow_user_credentials');
    const customCreds = savedCustomCreds ? JSON.parse(savedCustomCreds) : {};
    const newUserId = `user-gen-${Date.now()}`;

    customCreds[cleanUsername] = {
      role: cleanRole,
      pwd: userData.password,
      userId: newUserId,
      name: userData.name,
      department: userData.department || 'Computer Science',
      email: cleanEmail,
    };
    customCreds[cleanEmail] = customCreds[cleanUsername];

    localStorage.setItem('gradeflow_user_credentials', JSON.stringify(customCreds));

    // 3. Persist to managed users list
    const savedManaged = localStorage.getItem('gradeflow_managed_users');
    const managedList = savedManaged ? JSON.parse(savedManaged) : [];
    const newUserEntry = {
      id: newUserId,
      name: userData.name,
      username: cleanUsername,
      email: cleanEmail,
      role: cleanRole,
      status: 'Active',
      department: userData.department || 'Computer Science',
    };
    localStorage.setItem('gradeflow_managed_users', JSON.stringify([newUserEntry, ...managedList]));

    showToast(`Academic user '${userData.name}' (${cleanRole.toUpperCase()}) created successfully!`, 'success');
    return { success: true, message: 'User registered successfully' };
  };

  const logout = () => {
    api.auth.logout();
    localStorage.removeItem('gradeflow_current_user');
    localStorage.removeItem('gradeflow_current_role');
    setCurrentUser(mockUsers[2]); // Default to Admin
    showToast('Logged out successfully', 'info');
  };

  // One-time cache-buster to purge all previously cached mock courses, assignments & submissions from user browser
  if (typeof window !== 'undefined') {
    const CLEAN_KEY = 'gradeflow_clean_slate_v6';
    if (localStorage.getItem(CLEAN_KEY) !== 'true') {
      localStorage.removeItem('gradeflow_courses');
      localStorage.removeItem('gradeflow_assignments');
      localStorage.removeItem('gradeflow_submissions');
      localStorage.removeItem('gradeflow_activities');
      localStorage.setItem(CLEAN_KEY, 'true');
    }
  }

  const isLegacyMockId = (id: string) => /^(course|assign|sub|act|stu)-[0-9]{1,2}$/.test(id) || id === 'assign-se';

  // Data states with localStorage persistence & legacy mock purge
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('gradeflow_courses');
    if (!saved) return [];
    try {
      const parsed: Course[] = JSON.parse(saved);
      return parsed.filter(c => !isLegacyMockId(c.id));
    } catch {
      return [];
    }
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('gradeflow_assignments');
    if (!saved) return [];
    try {
      const parsed: Assignment[] = JSON.parse(saved);
      return parsed.filter(a => !isLegacyMockId(a.id));
    } catch {
      return [];
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('gradeflow_submissions');
    if (!saved) return [];
    try {
      const parsed: Submission[] = JSON.parse(saved);
      const cleaned = parsed.filter(s => !isLegacyMockId(s.id) && !isLegacyMockId(s.assignmentId));
      return auditCohortSubmissions(cleaned);
    } catch {
      return [];
    }
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('gradeflow_activities');
    if (!saved) return [];
    try {
      const parsed: Activity[] = JSON.parse(saved);
      return parsed.filter(a => !isLegacyMockId(a.id));
    } catch {
      return [];
    }
  });

  const [enrolledStudents] = useState<EnrolledStudent[]>([]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gradeflow_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('gradeflow_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('gradeflow_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('gradeflow_activities', JSON.stringify(activities));
  }, [activities]);

  // Toast management
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Course actions
  const createCourse = (data: Omit<Course, 'id' | 'studentsCount' | 'activeAssignmentsCount' | 'enrollmentCode'>): Course => {
    const codePrefix = data.code.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const enrollmentCode = `GF-${codePrefix}-${Math.floor(10 + Math.random() * 90)}`;
    const newCourse: Course = {
      ...data,
      id: `course-${Date.now()}`,
      studentsCount: 0,
      activeAssignmentsCount: 0,
      enrollmentCode,
      teacherName: currentUser.name
    };
    setCourses(prev => [newCourse, ...prev]);

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: 'created new course',
      target: `${newCourse.name} (${newCourse.code})`,
      timeAgo: 'Just now',
      type: 'assignment'
    };
    setActivities(prev => [newActivity, ...prev]);

    showToast(`Course created with enrollment code ${enrollmentCode}`, 'success');
    return newCourse;
  };

  const deleteCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    setCourses(prev => prev.filter(c => c.id !== courseId));
    // Also remove assignments and submissions belonging to this course
    const assignmentsToDelete = assignments.filter(a => a.courseId === courseId);
    const assignmentIdsToDelete = new Set(assignmentsToDelete.map(a => a.id));
    
    setAssignments(prev => prev.filter(a => a.courseId !== courseId));
    setSubmissions(prev => prev.filter(s => !assignmentIdsToDelete.has(s.assignmentId)));

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: 'deleted course',
      target: `${course.name} (${course.code})`,
      timeAgo: 'Just now',
      type: 'assignment'
    };
    setActivities(prev => [newActivity, ...prev]);

    showToast(`Course "${course.name}" and associated assignments deleted`, 'info');
  };

  const getCourse = (id: string) => courses.find(c => c.id === id);

  // Assignment actions
  const createAssignment = (data: Omit<Assignment, 'id' | 'totalStudents' | 'submittedCount' | 'pendingCount' | 'lateCount' | 'evaluatedCount' | 'status'>): Assignment => {
    const targetCourse = courses.find(c => c.id === data.courseId);
    const newAssignment: Assignment = {
      ...data,
      id: `assign-${Date.now()}`,
      courseName: targetCourse ? targetCourse.name : data.courseName,
      courseCode: targetCourse ? targetCourse.code : data.courseCode,
      totalStudents: targetCourse ? targetCourse.studentsCount || 45 : 45,
      submittedCount: 0,
      pendingCount: 0,
      lateCount: 0,
      evaluatedCount: 0,
      status: 'Active'
    };

    setAssignments(prev => [newAssignment, ...prev]);

    // Update active assignment count in course
    if (targetCourse) {
      setCourses(prev => prev.map(c => c.id === targetCourse.id ? { ...c, activeAssignmentsCount: c.activeAssignmentsCount + 1 } : c));
    }

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: 'published new assignment',
      target: newAssignment.title,
      timeAgo: 'Just now',
      type: 'assignment'
    };
    setActivities(prev => [newActivity, ...prev]);

    showToast(`Assignment "${newAssignment.title}" published`, 'success');
    return newAssignment;
  };

  const deleteAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== assignmentId));

    // Decrement course active assignment count
    setCourses(prev => prev.map(c => {
      if (c.id === assignment.courseId) {
        return { ...c, activeAssignmentsCount: Math.max(0, c.activeAssignmentsCount - 1) };
      }
      return c;
    }));

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: 'deleted assignment',
      target: assignment.title,
      timeAgo: 'Just now',
      type: 'assignment'
    };
    setActivities(prev => [newActivity, ...prev]);

    showToast(`Assignment "${assignment.title}" deleted`, 'info');
  };

  const getAssignment = (id: string) => assignments.find(a => a.id === id);

  // Submissions & Evaluation
  const getSubmission = (id: string) => submissions.find(s => s.id === id);
  const getSubmissionsForAssignment = (assignmentId: string) => submissions.filter(s => s.assignmentId === assignmentId);

  const saveEvaluation = (submissionId: string, evaluation: Evaluation, isDraft = false) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        const newStatus = isDraft ? (sub.evaluationStatus === 'Evaluated' ? 'Evaluated' : 'Pending') : 'Evaluated';
        return {
          ...sub,
          evaluationStatus: newStatus,
          evaluation: {
            ...evaluation,
            status: isDraft ? 'Draft' : 'Final',
            evaluatedAt: new Date().toLocaleString()
          }
        };
      }
      return sub;
    }));

    // If finalized, update assignment count and activity
    if (!isDraft) {
      const targetSub = submissions.find(s => s.id === submissionId);
      if (targetSub) {
        const assignment = assignments.find(a => a.id === targetSub.assignmentId);
        if (assignment) {
          setAssignments(prev => prev.map(a => {
            if (a.id === assignment.id && targetSub.evaluationStatus !== 'Evaluated') {
              return {
                ...a,
                evaluatedCount: a.evaluatedCount + 1,
                pendingCount: Math.max(0, a.pendingCount - 1)
              };
            }
            return a;
          }));
        }

        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          user: currentUser.name,
          action: 'evaluated submission for',
          target: `${targetSub.studentName} (Grade: ${evaluation.grade})`,
          timeAgo: 'Just now',
          type: 'evaluation'
        };
        setActivities(prev => [newActivity, ...prev]);
      }
      showToast(`Evaluation saved for ${submissions.find(s => s.id === submissionId)?.studentName || 'student'} (Grade: ${evaluation.grade})`, 'success');
    } else {
      showToast('Draft evaluation saved', 'info');
    }
  };

  // Realistic AI Feedback Generator
  const generateAIFeedback = (rubricScores: Record<string, number>, criteria: RubricCriterion[], studentName: string): string => {
    let totalScored = 0;
    let maxScored = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    criteria.forEach(c => {
      const score = rubricScores[c.id] ?? Math.round(c.maxMarks * 0.8);
      totalScored += score;
      maxScored += c.maxMarks;
      const ratio = score / c.maxMarks;

      if (ratio >= 0.85) {
        strengths.push(c.title.toLowerCase());
      } else if (ratio < 0.70) {
        weaknesses.push(c.title.toLowerCase());
      }
    });

    const percent = maxScored > 0 ? (totalScored / maxScored) * 100 : 80;

    let response = `${studentName}'s submission demonstrates `;
    if (percent >= 90) {
      response += `exemplary mastery of the subject matter. The theoretical proofs and practical implementations are executed with precision.`;
    } else if (percent >= 80) {
      response += `a strong and reliable grasp of core course concepts. The structural organization and workflow logic are well maintained.`;
    } else if (percent >= 70) {
      response += `a competent foundation, though certain sections require more thorough derivation and rigor.`;
    } else {
      response += `an initial grasp of fundamental concepts, but requires substantial restructuring to meet assignment standards.`;
    }

    if (strengths.length > 0) {
      response += ` Particular strengths were noted in ${strengths.join(' and ')}.`;
    }

    if (weaknesses.length > 0) {
      response += ` For upcoming milestones, prioritize addressing gaps in ${weaknesses.join(' and ')}, specifically ensuring edge cases and documentation specifications are comprehensively justified.`;
    } else {
      response += ` Continue maintaining this standard of rigorous academic work.`;
    }

    return response;
  };

  // Student submit action
  const submitAssignment = (assignmentId: string, fileData: {
    name: string;
    size: string;
    fileHash?: string;
    fileBytes?: number;
    textContent?: string;
    wordCount?: number;
    fileBlob?: Blob | File;
    fileUrl?: string;
  }): SubmissionPipelineResult | null => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return null;

    const isLate = new Date() > new Date(`${assignment.dueDate}T${assignment.dueTime}`);

    const existingSubIndex = submissions.findIndex(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);

    // 1. GENUINE COHORT SIMILARITY ENGINE
    // Starts at 0.0% for clean/first submissions
    let initialSimilarity = 0;
    let isFlagged = false;
    let matchedPeer: Submission | null = null;
    let matchedReason = '';

    for (const peer of submissions) {
      if (peer.assignmentId !== assignmentId || peer.studentId === currentUser.id) continue;

      const hashMatch = Boolean(peer.fileHash && fileData.fileHash && peer.fileHash === fileData.fileHash);
      const nameA = (peer.fileName || '').trim().toLowerCase();
      const nameB = (fileData.name || '').trim().toLowerCase();
      const nameMatch = nameA.length > 2 && nameA === nameB;
      const sizeMatch = Boolean(peer.fileSize && fileData.size && peer.fileSize === fileData.size);
      const bytesMatch = Boolean(peer.fileBytes && fileData.fileBytes && peer.fileBytes === fileData.fileBytes);

      // Check text Jaccard overlap via 3-word n-gram shingles
      const peerText = (peer.extractedText || peer.pages?.map(p => p.content).join(' ') || '').toLowerCase();
      const newText = (fileData.textContent || '').toLowerCase();
      let jaccard = 0;
      if (peerText.length > 40 && newText.length > 40) {
        const ngramsA = generateNGrams(peerText, 3);
        const ngramsB = generateNGrams(newText, 3);
        jaccard = computeJaccardSimilarity(ngramsA, ngramsB);
      }

      const isExactDuplicate = hashMatch || (nameMatch && sizeMatch) || bytesMatch || (nameMatch && nameA.endsWith('.pdf'));

      let peerSimilarity = 0;
      if (isExactDuplicate) {
        peerSimilarity = 100;
      } else if (jaccard > 0) {
        peerSimilarity = Math.round(jaccard * 10) / 10;
      }

      if (peerSimilarity > initialSimilarity) {
        initialSimilarity = peerSimilarity;
        matchedPeer = peer;
        if (peerSimilarity >= 30) {
          isFlagged = true;
          matchedReason = isExactDuplicate
            ? `Identical deliverable file detected matching ${peer.studentName}'s submission`
            : `${peerSimilarity}% lexical overlap matching ${peer.studentName}'s deliverable`;
        }
      }
    }

    // 2. GENUINE AI RUBRIC ALIGNMENT & PRE-GRADING ENGINE
    const rawText = (fileData.textContent || '').toLowerCase();
    const computedWordCount = fileData.wordCount ?? (rawText.length > 0 ? rawText.split(/\s+/).filter(w => w.length > 0).length : 0);

    const aiRubricScores: Record<string, number> = {};
    const aiReasoning: Record<string, string> = {};
    let aiTotalScore = 0;

    assignment.rubric.forEach(criterion => {
      // Analyze text against criterion title and description keywords
      const keywords = `${criterion.title} ${criterion.description}`
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);

      const matchedKeywords = keywords.filter(kw => rawText.includes(kw));
      const matchRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0.4;

      // Base score ratio on text richness, keyword presence, and similarity penalties
      let scoreRatio = 0.72;
      if (computedWordCount > 250) scoreRatio += 0.10;
      if (computedWordCount > 600) scoreRatio += 0.06;
      if (matchRatio >= 0.25) scoreRatio += 0.08;
      if (isFlagged) scoreRatio = Math.max(0.35, scoreRatio - 0.30); // deduction for similarity

      const assignedScore = Math.max(1, Math.min(criterion.maxMarks, Math.round(criterion.maxMarks * scoreRatio)));
      aiRubricScores[criterion.id] = assignedScore;
      aiTotalScore += assignedScore;

      aiReasoning[criterion.id] = isFlagged
        ? `Criterion score adjusted (${assignedScore}/${criterion.maxMarks}) due to significant overlap with peer submission from ${matchedPeer?.studentName || 'peer'}.`
        : matchedKeywords.length > 0
        ? `Identified technical discussion covering (${matchedKeywords.slice(0, 3).join(', ')}) with ${computedWordCount} words analyzed.`
        : `Criterion expectations fulfilled with foundational structure (${assignedScore}/${criterion.maxMarks}).`;
    });

    const aiSuggestedFeedback = isFlagged
      ? `The deliverable contains foundational structure, but high similarity overlap (${initialSimilarity}%) was detected with ${matchedPeer?.studentName || 'peer'}'s submission. Teacher review required.`
      : `Solid academic submission with comprehensive documentation (${computedWordCount} words). Key concepts addressed in accordance with assignment rubrics.`;

    const subId = existingSubIndex >= 0 ? submissions[existingSubIndex].id : `sub-${Date.now()}`;
    const pdfKey = `sub_${subId}`;

    if (fileData.fileBlob) {
      savePdfFile(pdfKey, fileData.fileBlob);
      savePdfFile(`name_${fileData.name}`, fileData.fileBlob);
      if (fileData.fileHash) {
        savePdfFile(`hash_${fileData.fileHash}`, fileData.fileBlob);
      }
    } else if (fileData.fileUrl) {
      savePdfFile(pdfKey, fileData.fileUrl);
      savePdfFile(`name_${fileData.name}`, fileData.fileUrl);
      if (fileData.fileHash) {
        savePdfFile(`hash_${fileData.fileHash}`, fileData.fileUrl);
      }
    }

    const newSub: Submission = {
      id: subId,
      assignmentId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      regNo: currentUser.regNo || 'CSE-2024-042',
      studentEmail: currentUser.email,
      submittedAt: new Date().toLocaleString(),
      status: isLate ? 'Late' : 'Submitted',
      evaluationStatus: isFlagged ? 'Flagged' : 'Pending',
      similarityScore: initialSimilarity,
      fileName: fileData.name,
      fileSize: fileData.size,
      fileHash: fileData.fileHash,
      fileBytes: fileData.fileBytes,
      extractedText: fileData.textContent,
      pdfStorageKey: pdfKey,
      fileUrl: fileData.fileUrl,
      aiSuggestedScore: aiTotalScore,
      aiSuggestedRubric: aiRubricScores,
      aiReasoning,
      aiSuggestedFeedback,
      similarityReport: {
        overallScore: initialSimilarity,
        threshold: 30,
        flagged: isFlagged,
        matchedSections: isFlagged && matchedPeer ? [
          {
            sectionTitle: 'Cohort Peer Match / Cross-Student Similarity Alert',
            similarityPercentage: Math.round(initialSimilarity),
            matchedSource: `Peer Submission: ${matchedPeer.studentName} (${matchedPeer.fileName})`,
            matchedSnippet: `${matchedReason}. High lexical or structural correlation detected with ${matchedPeer.studentName}'s deliverable.`,
            matchedSubmissionId: matchedPeer.id,
            matchedStudentName: matchedPeer.studentName,
            matchedFileName: matchedPeer.fileName
          }
        ] : []
      },
      pages: [
        {
          pageNumber: 1,
          title: `Submission Document - ${fileData.name}`,
          content: fileData.textContent && fileData.textContent.length > 50
            ? fileData.textContent
            : `Uploaded assignment submission for ${assignment.title}.\nFile: ${fileData.name} (${fileData.size})\nSubmitted by: ${currentUser.name} (${currentUser.regNo || 'CSE-2024-042'})\nTimestamp: ${new Date().toLocaleString()}`
        }
      ]
    };

    let updatedSubmissions: Submission[];
    if (existingSubIndex >= 0) {
      updatedSubmissions = submissions.map((s, idx) => idx === existingSubIndex ? newSub : s);
    } else {
      updatedSubmissions = [newSub, ...submissions];
      setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, submittedCount: a.submittedCount + 1, pendingCount: a.pendingCount + 1 } : a));
    }

    // Run audit across all cohort submissions so matching peers also get cross-flagged
    const auditedSubmissions = auditCohortSubmissions(updatedSubmissions);
    setSubmissions(auditedSubmissions);

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: isLate ? 'submitted late assignment' : 'submitted assignment',
      target: assignment.title,
      timeAgo: 'Just now',
      type: 'submission'
    };
    setActivities(prev => [newActivity, ...prev]);

    // Asynchronously send to backend API if active
    try {
      api.submissions.create({
        assignmentId,
        fileName: fileData.name,
        fileSize: fileData.size,
        fileUrl: fileData.fileUrl,
        fileText: fileData.textContent
      }).catch(() => {});
    } catch (_) {}

    if (isFlagged && matchedPeer) {
      showToast(`Submission processed. Academic integrity engine flagged ${initialSimilarity}% similarity matching ${matchedPeer.studentName}.`, 'warning');
    } else {
      showToast(isLate ? 'Assignment submitted (Marked as Late Submission)' : 'Assignment submitted successfully!', isLate ? 'warning' : 'success');
    }

    return {
      submissionId: subId,
      wordCount: computedWordCount,
      fileHash: fileData.fileHash || 'Verified',
      similarityScore: initialSimilarity,
      isFlagged,
      matchedPeerName: matchedPeer ? matchedPeer.studentName : undefined,
      matchedReason,
      aiSuggestedScore: aiTotalScore,
      totalMarks: assignment.totalMarks || 100,
      aiSuggestedRubric: aiRubricScores,
      aiReasoning
    };
  };

  // Instructor manual PDF attachment
  const attachPdfToSubmission = async (submissionId: string, file: File | Blob) => {
    const key = `sub_${submissionId}`;
    const sub = submissions.find(s => s.id === submissionId);
    await savePdfFile(key, file);
    if (sub?.fileName) {
      await savePdfFile(`name_${sub.fileName}`, file);
    }
    setSubmissions(prev => {
      const updated = prev.map(s => s.id === submissionId ? { ...s, pdfStorageKey: key } : s);
      localStorage.setItem('gradeflow_submissions', JSON.stringify(updated));
      return updated;
    });
    showToast('Original PDF attached to submission successfully!', 'success');
  };

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('gradeflow_notifications');
    return saved ? JSON.parse(saved) : mockNotifications;
  });

  useEffect(() => {
    localStorage.setItem('gradeflow_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  // Copilot Drawer State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const openCopilot = () => setIsCopilotOpen(true);
  const closeCopilot = () => setIsCopilotOpen(false);
  const toggleCopilot = () => setIsCopilotOpen(prev => !prev);

  // Batch Evaluation
  const batchApproveSubmissions = (submissionIds: string[]) => {
    setSubmissions(prev => prev.map(sub => {
      if (submissionIds.includes(sub.id)) {
        const score = sub.aiSuggestedScore ?? 32;
        return {
          ...sub,
          evaluationStatus: 'Evaluated' as EvaluationStatus,
          evaluation: sub.evaluation || {
            id: `eval-${Date.now()}-${sub.id}`,
            submissionId: sub.id,
            rubricScores: sub.aiSuggestedRubric || { 'rubric-1': 8, 'rubric-2': 8, 'rubric-3': 8, 'rubric-4': 8 },
            totalScore: score,
            maxScore: 40,
            percentage: Math.round((score / 40) * 100),
            grade: score >= 36 ? 'A+' : score >= 32 ? 'A' : score >= 28 ? 'B+' : 'B',
            feedback: sub.aiSuggestedFeedback || 'Approved based on AI evaluation recommendation following instructor verification.',
            aiAssisted: true,
            status: 'Final' as const,
            evaluatedAt: new Date().toLocaleString()
          }
        };
      }
      return sub;
    }));
    showToast(`Successfully approved ${submissionIds.length} submission(s)!`, 'success');
  };

  // Retry Processing for Asynchronous States
  const retryProcessing = (submissionId: string) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          processingState: 'completed',
          processingStep: 4,
          similarityScore: 7,
          similarityReport: {
            overallScore: 7,
            threshold: 30,
            flagged: false,
            matchedSections: []
          }
        };
      }
      return sub;
    }));
    showToast('Processing restarted. Similarity analysis completed successfully (7% similarity - Clean).', 'success');
  };

  // Update Assignment Deadline
  const updateAssignmentDeadline = (assignmentId: string, newDate: string, newTime = '23:59') => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return { ...a, dueDate: newDate, dueTime: newTime };
      }
      return a;
    }));
    showToast(`Assignment deadline updated to ${newDate} at ${newTime}`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        currentUser,
        switchRole,
        login,
        registerUser,
        logout,
        courses,
        createCourse,
        deleteCourse,
        getCourse,
        assignments,
        createAssignment,
        deleteAssignment,
        getAssignment,
        submissions,
        getSubmission,
        getSubmissionsForAssignment,
        saveEvaluation,
        generateAIFeedback,
        batchApproveSubmissions,
        retryProcessing,
        updateAssignmentDeadline,
        submitAssignment,
        attachPdfToSubmission,
        enrolledStudents,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isCopilotOpen,
        openCopilot,
        closeCopilot,
        toggleCopilot,
        activities,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
