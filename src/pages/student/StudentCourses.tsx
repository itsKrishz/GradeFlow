import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { 
  BookOpen, 
  Plus, 
  Users, 
  FileText, 
  Check, 
  ArrowRight, 
  Calendar, 
  Award, 
  Clock, 
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentCourses: React.FC = () => {
  const { courses, assignments, submissions, currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleJoinCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentCode) return;
    showToast(`Successfully enrolled in course using code ${enrollmentCode.toUpperCase()}!`, 'success');
    setShowJoinModal(false);
    setEnrollmentCode('');
  };

  // Find assignments for the currently selected course
  const selectedCourseAssignments = selectedCourse
    ? assignments.filter(a => a.courseId === selectedCourse.id || a.courseCode === selectedCourse.code)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            My Enrolled Courses
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Click any enrolled course to view all assigned deliverables, deadlines, and submission statuses.
          </p>
        </div>

        <button
          onClick={() => setShowJoinModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Join Course with Code</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.map((course) => {
          const courseAssignments = assignments.filter(
            a => a.courseId === course.id || a.courseCode === course.code
          );

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                    {course.code}
                  </span>
                  <span className="text-xs text-slate-500">
                    Section {course.section}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {course.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {course.description}
                </p>

                <div className="pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between text-xs text-slate-500">
                  <span>Instructor: <strong>{course.teacherName || 'Prof. Sarah Jenkins'}</strong></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {courseAssignments.length} Assignments
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                  <span>View Course Assignments</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* COURSE ASSIGNMENTS INSPECTION MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                    {selectedCourse.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Section {selectedCourse.section} • {selectedCourse.semester}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedCourse.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instructor: <strong>{selectedCourse.teacherName || 'Prof. Sarah Jenkins'}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Course Description Banner */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              {selectedCourse.description}
            </div>

            {/* Assigned Deliverables Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Assigned Course Deliverables ({selectedCourseAssignments.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Graded using structured rubrics
                </span>
              </div>

              {selectedCourseAssignments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No assignments currently assigned
                  </p>
                  <p className="text-xs text-slate-500">
                    Your instructor has not posted any assignments for this course yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCourseAssignments.map((assignment) => {
                    const mySub = submissions.find(
                      s => s.assignmentId === assignment.id && (s.studentId === currentUser.id || s.regNo === currentUser.regNo)
                    );
                    const isSubmitted = !!mySub;
                    const isEvaluated = mySub && mySub.evaluationStatus === 'Evaluated';

                    return (
                      <div
                        key={assignment.id}
                        className="p-4 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {assignment.title}
                            </h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {assignment.description}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isEvaluated ? (
                              <Badge variant="green" size="sm">
                                Graded ({mySub.evaluation?.totalScore}/{mySub.evaluation?.maxScore})
                              </Badge>
                            ) : isSubmitted ? (
                              <Badge variant="blue" size="sm">
                                Submitted ({mySub.evaluationStatus})
                              </Badge>
                            ) : (
                              <Badge variant="amber" size="sm">
                                Pending Submission
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Meta: Due Date, Total Marks, Rubrics */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Due: <strong>{assignment.dueDate} at {assignment.dueTime}</strong></span>
                            </span>
                            <span>Total Marks: <strong>{assignment.totalMarks}</strong> ({assignment.rubric?.length || 4} Criteria)</span>
                          </div>

                          {/* Action button */}
                          <div>
                            {isEvaluated ? (
                              <button
                                onClick={() => {
                                  setSelectedCourse(null);
                                  navigate(`/student/grades/${mySub.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>View Graded Rubric</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedCourse(null);
                                  navigate(`/student/submit/${assignment.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
                              >
                                <span>{isSubmitted ? 'Resubmit / Edit' : 'Submit Assignment'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Course Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Join Academic Course
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter the unique 6-8 character course enrollment code provided by your instructor.
            </p>

            <form onSubmit={handleJoinCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enrollment Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GF-DBMS-26"
                  value={enrollmentCode}
                  onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm"
                >
                  Enroll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
