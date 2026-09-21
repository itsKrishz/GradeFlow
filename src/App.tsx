import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth
import { Login } from './pages/auth/Login';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { Courses } from './pages/teacher/Courses';
import { CourseDetail } from './pages/teacher/CourseDetail';
import { Assignments } from './pages/teacher/Assignments';
import { AssignmentCreate } from './pages/teacher/AssignmentCreate';
import { AssignmentDetail } from './pages/teacher/AssignmentDetail';
import { SubmissionsList } from './pages/teacher/SubmissionsList';
import { EvaluationWorkspace } from './pages/teacher/EvaluationWorkspace';
import { Analytics } from './pages/teacher/Analytics';
import { Reports } from './pages/teacher/Reports';
import { Settings } from './pages/teacher/Settings';
import { Copilot } from './pages/teacher/Copilot';
import { EvaluationInbox } from './pages/teacher/EvaluationInbox';
import { BatchEvaluation } from './pages/teacher/BatchEvaluation';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentCourses } from './pages/student/StudentCourses';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { StudentSubmit } from './pages/student/StudentSubmit';
import { StudentGrades } from './pages/student/StudentGrades';
import { StudentGradeDetail } from './pages/student/StudentGradeDetail';
import { StudentPerformance } from './pages/student/StudentPerformance';
import { StudentProfile } from './pages/student/StudentProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminSystem } from './pages/admin/AdminSystem';

// Helper to redirect to active role dashboard
const RootRedirect: React.FC = () => {
  const { currentUser } = useApp();
  if (currentUser.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/teacher/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<AppLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="assignments/create" element={<AssignmentCreate />} />
            <Route path="assignments/:assignmentId" element={<AssignmentDetail />} />
            <Route path="submissions/:assignmentId" element={<SubmissionsList />} />
            <Route path="inbox" element={<EvaluationInbox />} />
            <Route path="batch-evaluation/:assignmentId" element={<BatchEvaluation />} />
            <Route path="evaluation/:assignmentId" element={<EvaluationWorkspace />} />
            <Route path="copilot" element={<Copilot />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<AppLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="submit/:assignmentId" element={<StudentSubmit />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="grades/:submissionId" element={<StudentGradeDetail />} />
            <Route path="performance" element={<StudentPerformance />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AppLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
