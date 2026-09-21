import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Award, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentGrades: React.FC = () => {
  const { submissions, assignments, currentUser } = useApp();
  const navigate = useNavigate();

  const studentSubmissions = submissions.filter(s => s.studentId === currentUser.id || s.regNo === currentUser.regNo);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Grades & Evaluator Feedback
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Comprehensive rubric scores, qualitative feedback, and final grade calculations.
        </p>
      </div>

      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Assignment Title</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Score / Max</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {studentSubmissions.map((sub) => {
                const asg = assignments.find(a => a.id === sub.assignmentId);
                const isEvaluated = sub.evaluationStatus === 'Evaluated';

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {asg?.title || 'Assignment'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {asg?.courseCode || 'DBMS'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sub.submittedAt}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      {isEvaluated ? `${sub.evaluation?.totalScore} / ${sub.evaluation?.maxScore}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {isEvaluated ? `${sub.evaluation?.percentage}%` : 'Pending'}
                    </td>
                    <td className="px-4 py-3">
                      {isEvaluated ? (
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Grade {sub.evaluation?.grade}
                        </span>
                      ) : (
                        <Badge variant="amber" size="sm">Grading in Progress</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isEvaluated ? (
                        <button
                          onClick={() => navigate(`/student/grades/${sub.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                        >
                          <span>View Rubric</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Under Evaluation</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
