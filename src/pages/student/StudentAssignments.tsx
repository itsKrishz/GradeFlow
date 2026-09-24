import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Calendar, Upload, CheckCircle2, Clock, ArrowRight, Award } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentAssignments: React.FC = () => {
  const { assignments, submissions, currentUser } = useApp();
  const navigate = useNavigate();

  const studentSubmissions = submissions.filter(s => s.studentId === currentUser.id || s.regNo === currentUser.regNo);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Course Assignments
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Review deliverables, track submission deadlines, and submit files for rubric evaluation.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No assignments posted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your instructor has not posted any active assignments yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
          const mySub = studentSubmissions.find(s => s.assignmentId === assignment.id);
          const isSubmitted = !!mySub;

          return (
            <div
              key={assignment.id}
              className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                    {assignment.courseCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {assignment.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                  {assignment.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: <strong>{assignment.dueDate} at {assignment.dueTime}</strong></span>
                  </span>
                  <span>Total Marks: <strong>{assignment.totalMarks}</strong></span>
                  <span>
                    Status:{' '}
                    {isSubmitted ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Submitted ({mySub.evaluationStatus})
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Pending Submission
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                {isSubmitted && mySub.evaluationStatus === 'Evaluated' ? (
                  <button
                    onClick={() => navigate(`/student/grades/${mySub.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Graded Rubric ({mySub.evaluation?.totalScore}/{mySub.evaluation?.maxScore})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/student/submit/${assignment.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isSubmitted ? 'Resubmit Deliverable' : 'Submit Assignment'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
