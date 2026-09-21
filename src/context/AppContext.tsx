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
  EvaluationStatus
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

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;

  // Auth / Current User
  currentUser: User;
  switchRole: (role: Role) => void;
  login: (identifier: string, password?: string, roleOverride?: Role) => boolean;
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
  submitAssignment: (assignmentId: string, fileData: { name: string; size: string }) => void;
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
    const savedRole = localStorage.getItem('gradeflow_current_role') as Role;
    const found = mockUsers.find(u => u.role === savedRole);
    return found || mockUsers[0]; // Default to Teacher
  });

  const switchRole = (role: Role) => {
    const target = mockUsers.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('gradeflow_current_role', role);
      showToast(`Switched to ${role.toUpperCase()} mode: ${target.name}`, 'info');
    }
  };

  const login = (identifier: string, password?: string, roleOverride?: Role): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    
    // Exact credential rules specified:
    // admin: admin / admin123
    // teacher: teacher / teacher123
    // student: student / student123
    const credentials: Record<string, { role: Role; pwd: string; userId: string }> = {
      admin: { role: 'admin', pwd: 'admin123', userId: 'user-3' },
      'admin@gradeflow.edu': { role: 'admin', pwd: 'admin123', userId: 'user-3' },
      teacher: { role: 'teacher', pwd: 'teacher123', userId: 'user-1' },
      'teacher@gradeflow.edu': { role: 'teacher', pwd: 'teacher123', userId: 'user-1' },
      student: { role: 'student', pwd: 'student123', userId: 'user-2' },
      'rahul.k@student.edu': { role: 'student', pwd: 'student123', userId: 'user-2' },
      'student@gradeflow.edu': { role: 'student', pwd: 'student123', userId: 'user-2' }
    };

    const cred = credentials[cleanId];

    // If password provided, validate it
    if (password !== undefined) {
      if (!cred || cred.pwd !== password) {
        showToast('Invalid username or password. Please verify your credentials.', 'error');
        return false;
      }
    }

    let matched = mockUsers.find(u => 
      u.username?.toLowerCase() === cleanId || 
      u.email.toLowerCase() === cleanId ||
      (cred && u.id === cred.userId)
    );

    if (!matched && roleOverride) {
      matched = mockUsers.find(u => u.role === roleOverride);
    }
    if (!matched) {
      matched = mockUsers[0];
    }

    setCurrentUser(matched);
    localStorage.setItem('gradeflow_current_role', matched.role);
    showToast(`Welcome back, ${matched.name}`, 'success');
    return true;
  };

  const logout = () => {
    setCurrentUser(mockUsers[0]);
    localStorage.removeItem('gradeflow_current_role');
    showToast('Logged out successfully', 'info');
  };

  // Data states with localStorage persistence
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('gradeflow_courses');
    return saved ? JSON.parse(saved) : mockCourses;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('gradeflow_assignments');
    return saved ? JSON.parse(saved) : mockAssignments;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('gradeflow_submissions');
    return saved ? JSON.parse(saved) : mockSubmissions;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('gradeflow_activities');
    return saved ? JSON.parse(saved) : mockRecentActivity;
  });

  const [enrolledStudents] = useState<EnrolledStudent[]>(mockEnrolledStudents);

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
  const submitAssignment = (assignmentId: string, fileData: { name: string; size: string }) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const isLate = new Date() > new Date(`${assignment.dueDate}T${assignment.dueTime}`);

    const existingSubIndex = submissions.findIndex(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);

    const newSub: Submission = {
      id: existingSubIndex >= 0 ? submissions[existingSubIndex].id : `sub-${Date.now()}`,
      assignmentId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      regNo: currentUser.regNo || 'CSE-2024-042',
      studentEmail: currentUser.email,
      submittedAt: new Date().toLocaleString(),
      status: isLate ? 'Late' : 'Submitted',
      evaluationStatus: 'Pending',
      similarityScore: 14,
      fileName: fileData.name,
      fileSize: fileData.size,
      similarityReport: {
        overallScore: 14,
        threshold: 30,
        flagged: false,
        matchedSections: []
      },
      pages: [
        {
          pageNumber: 1,
          title: `Submission Document - ${fileData.name}`,
          content: `Uploaded assignment submission for ${assignment.title}.\nFile: ${fileData.name} (${fileData.size})\nSubmitted by: ${currentUser.name} (${currentUser.regNo || 'CSE-2024-042'})\nTimestamp: ${new Date().toLocaleString()}`
        }
      ]
    };

    if (existingSubIndex >= 0) {
      setSubmissions(prev => prev.map((s, idx) => idx === existingSubIndex ? newSub : s));
    } else {
      setSubmissions(prev => [newSub, ...prev]);
      setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, submittedCount: a.submittedCount + 1, pendingCount: a.pendingCount + 1 } : a));
    }

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      user: currentUser.name,
      action: isLate ? 'submitted late assignment' : 'submitted assignment',
      target: assignment.title,
      timeAgo: 'Just now',
      type: 'submission'
    };
    setActivities(prev => [newActivity, ...prev]);

    showToast(isLate ? 'Assignment submitted (Marked as Late Submission)' : 'Assignment submitted successfully!', isLate ? 'warning' : 'success');
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
