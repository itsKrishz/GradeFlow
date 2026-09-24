import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Users, 
  FileText, 
  Search, 
  Plus, 
  ArrowUpRight, 
  Mail, 
  Award,
  BookOpen,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, assignments, enrolledStudents, submissions, deleteCourse, deleteAssignment, showToast } = useApp();

  const course = courses.find(c => c.id === courseId) || courses[0];

  if (!course) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto mt-12 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl shadow-sm">
        <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Course Not Found</h3>
        <p className="text-xs text-slate-500">The requested course does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/teacher/courses')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const currentTab = searchParams.get('tab') || 'overview';

  const [studentSearch, setStudentSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any | null>(null);

  const courseAssignments = assignments.filter(a => a.courseId === course.id || a.courseCode === course.code);
  const courseStudents = enrolledStudents.filter(s => s.courseId === course.id);

  // Compute actual average class grade across course assignments
  const courseAsgIds = new Set(courseAssignments.map(a => a.id));
  const courseSubmissions = submissions.filter(s => courseAsgIds.has(s.assignmentId));
  const courseEvalSubmissions = courseSubmissions.filter(s => s.evaluation && s.evaluation.maxScore > 0);

  const avgClassGradeVal = courseEvalSubmissions.length > 0
    ? courseEvalSubmissions.reduce((acc, s) => acc + (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100, 0) / courseEvalSubmissions.length
    : null;

  const avgClassGradeStr = avgClassGradeVal !== null
    ? `${avgClassGradeVal.toFixed(1)}% (${avgClassGradeVal >= 90 ? 'A+' : avgClassGradeVal >= 80 ? 'A' : avgClassGradeVal >= 70 ? 'B' : avgClassGradeVal >= 60 ? 'C' : 'D'})`
    : '— (No evaluations yet)';

  const filteredStudents = courseStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.regNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(course.enrollmentCode);
    setCopiedCode(true);
    showToast(`Enrollment code ${course.enrollmentCode} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/teacher/courses')}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400">Courses /</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{course.name}</span>
      </div>

      {/* Course Header Banner */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                {course.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Section {course.section} • {course.semester} ({course.academicYear})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {course.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Quick Metrics & Enrollment Code */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Copy code to share with students"
            >
              <span>Code: <strong>{course.enrollmentCode}</strong></span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            <button
              onClick={() => navigate(`/teacher/assignments/create?courseId=${course.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>

            <button
              onClick={() => setConfirmDeleteCourse(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
              title="Delete Course"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Course</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-academic-lightBorder dark:border-academic-darkBorder mt-6 -mb-6">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              currentTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('students')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'students'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({courseStudents.length})</span>
          </button>
          <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              currentTab === 'assignments'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Assignments ({courseAssignments.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Metrics */}
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-academic-lightMuted dark:text-academic-darkMuted">
              Course Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <span className="text-slate-600 dark:text-slate-400">Total Enrolled</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{course.studentsCount} Students</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <span className="text-slate-600 dark:text-slate-400">Active Assignments</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{courseAssignments.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <span className="text-slate-600 dark:text-slate-400">Average Class Grade</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{avgClassGradeStr}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Similarity Threshold</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">30% Flag Limit</span>
              </div>
            </div>
          </div>

          {/* Syllabus & Course Topics */}
          <div className="md:col-span-2 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-academic-lightMuted dark:text-academic-darkMuted flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Syllabus Highlights & Evaluation Policy</span>
            </h3>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                • <strong>Evaluation Method:</strong> Structured rubric criteria covering theoretical derivation, query optimization proofs, and software engineering best practices.
              </p>
              <p>
                • <strong>Late Penalty Policy:</strong> 5% penalty deduction per 24-hour cycle past scheduled submission timestamp, unless pre-approved by the instructor.
              </p>
              <p>
                • <strong>Academic Integrity Protocol:</strong> Automated similarity cross-matching flags submissions exceeding 30% textual or code overlap with institutional repositories. All flagged reports undergo mandatory instructor evaluation before final marks are confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {currentTab === 'students' && (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm">
          <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Enrolled Students
              </h3>
              <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted">
                View student performance, registration numbers, and submission completion.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, reg no, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-academic-primary w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Reg. Number</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Avg. Grade</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {stu.name.charAt(0)}
                      </div>
                      <span>{stu.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {stu.regNo}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {stu.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="green" size="sm">
                        {stu.enrollmentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {stu.averageGrade}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => showToast(`Contact modal for ${stu.name} opened`, 'info')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
                        title="Email Student"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (courseAssignments[0]) {
                            navigate(`/teacher/evaluation/${courseAssignments[0].id}`);
                          } else {
                            showToast('No assignments in this course yet. Create one first.', 'info');
                          }
                        }}
                        className="px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                      >
                        Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {currentTab === 'assignments' && (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm">
          <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Course Assignments
              </h3>
              <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted">
                Create rubrics, monitor deadlines, and evaluate student work.
              </p>
            </div>

            <button
              onClick={() => navigate(`/teacher/assignments/create?courseId=${course.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          </div>

          <div className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
            {courseAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Due: {assignment.dueDate} at {assignment.dueTime} • Total Marks: {assignment.totalMarks} • Rubric: {assignment.rubric.length} Criteria
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Submissions: <strong className="text-slate-900 dark:text-slate-100">{assignment.submittedCount}/{assignment.totalStudents}</strong>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      Pending: <strong>{assignment.pendingCount}</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Evaluated: <strong>{assignment.evaluatedCount}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => navigate(`/teacher/evaluation/${assignment.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors"
                  >
                    Evaluate Submissions
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setAssignmentToDelete(assignment)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE COURSE MODAL */}
      {confirmDeleteCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Delete Course
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong>{course.name} ({course.code})</strong>? 
              This will permanently remove the course and all associated assignments and submissions.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteCourse(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCourse(course.id);
                  navigate('/teacher/courses');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ASSIGNMENT MODAL */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Delete Assignment
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong>{assignmentToDelete.title}</strong>? 
              This will remove the assignment and student submissions recorded for it.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setAssignmentToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAssignment(assignmentToDelete.id);
                  setAssignmentToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
