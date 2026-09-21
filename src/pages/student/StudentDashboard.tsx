import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Award, 
  ArrowRight, 
  Upload, 
  Calendar, 
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentDashboard: React.FC = () => {
  const { assignments, submissions, currentUser } = useApp();
  const navigate = useNavigate();

  // Find submissions by this student
  const studentSubmissions = submissions.filter(s => s.studentId === currentUser.id || s.regNo === currentUser.regNo);

  const evaluatedSubmissions = studentSubmissions.filter(s => s.evaluationStatus === 'Evaluated');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              {currentUser.regNo || 'CSE-2024-042'}
            </span>
            <span className="text-xs text-slate-500">Department of Computer Science</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            You have active assignments requiring submission and recently published rubric evaluations.
          </p>
        </div>

        {/* Quick Performance Indicators */}
        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-academic-lightBorder dark:border-academic-darkBorder pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">GPA / Average</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              88.5% (A)
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Completed</span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {evaluatedSubmissions.length} Tasks
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Assignments (2 cols) & Recent Grades (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm">
          <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Upcoming Assignments
              </h3>
              <p className="text-xs text-slate-500">
                Submit deliverables before scheduled deadlines.
              </p>
            </div>
            <button
              onClick={() => navigate('/student/assignments')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
            {assignments.map((assignment) => {
              const mySub = studentSubmissions.find(s => s.assignmentId === assignment.id);
              const isSubmitted = !!mySub;

              return (
                <div
                  key={assignment.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                        {assignment.courseCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {assignment.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {assignment.dueDate} at {assignment.dueTime}</span>
                      </span>
                      <span>•</span>
                      <span>Total Marks: {assignment.totalMarks}</span>
                    </div>

                    <div className="mt-2">
                      {isSubmitted ? (
                        <Badge variant="green" size="sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Submitted on {mySub.submittedAt}</span>
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm">
                          <Clock className="w-3 h-3" />
                          <span>Not Submitted</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {isSubmitted && mySub?.evaluationStatus === 'Evaluated' ? (
                      <button
                        onClick={() => navigate(`/student/grades/${mySub.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Evaluation</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/student/submit/${assignment.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isSubmitted ? 'Resubmit File' : 'Submit Assignment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Grades & Evaluation Feedback */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Grades & Feedback
            </h3>
            <p className="text-xs text-slate-500">
              Official graded results evaluated against rubrics.
            </p>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {evaluatedSubmissions.length > 0 ? (
              evaluatedSubmissions.map((sub) => {
                const asg = assignments.find(a => a.id === sub.assignmentId);
                return (
                  <div key={sub.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {asg?.title || 'Assignment Evaluation'}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {asg?.courseCode || 'DBMS'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {sub.evaluation?.totalScore} / {sub.evaluation?.maxScore}
                        </span>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Grade {sub.evaluation?.grade}
                        </div>
                      </div>
                    </div>

                    {sub.evaluation?.feedback && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-800 leading-normal">
                        "{sub.evaluation.feedback}"
                      </p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => navigate(`/student/grades/${sub.id}`)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>View Rubric Breakdown</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No evaluated assignments yet. Check back soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
