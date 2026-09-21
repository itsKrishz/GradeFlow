import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentGradeDetail: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { submissions, assignments } = useApp();

  const submission = submissions.find(s => s.id === submissionId) || submissions[0];
  const assignment = assignments.find(a => a.id === submission.assignmentId) || assignments[0];
  const evaluation = submission.evaluation;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400">Grades /</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{assignment.title}</span>
      </div>

      {/* Grade Banner */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                {assignment.courseCode}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {assignment.courseName}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {assignment.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated on {evaluation?.evaluatedAt || submission.submittedAt}
            </p>
          </div>

          {/* Grade Card Summary */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Marks</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {evaluation?.totalScore || 34} <span className="text-xs font-normal text-slate-500">/ {assignment.totalMarks}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Grade</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {evaluation?.grade || 'A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Rubric Breakdown & Teacher Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rubric Breakdown (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Rubric Criterion Scores</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {assignment.rubric.length} Evaluation Criteria
            </span>
          </div>

          <div className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
            {assignment.rubric.map((criterion, idx) => {
              const score = evaluation?.rubricScores?.[criterion.id] ?? Math.round(criterion.maxMarks * 0.85);

              return (
                <div key={criterion.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">#{idx + 1}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {criterion.title}
                      </h4>
                    </div>

                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {score} <span className="text-slate-400 font-normal">/ {criterion.maxMarks}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {criterion.description}
                  </p>

                  {/* Visual Score Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      style={{ width: `${(score / criterion.maxMarks) * 100}%` }}
                      className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher Feedback Card (1 col) */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Instructor Feedback
            </h3>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-serif">
            "{evaluation?.feedback || 'Good implementation. Improve documentation and explain your methodology more clearly in future submissions.'}"
          </div>

          <div className="pt-2 border-t border-academic-lightBorder dark:border-academic-darkBorder text-xs text-slate-500 space-y-1">
            <p><strong>Evaluator:</strong> Prof. Sarah Jenkins</p>
            <p><strong>Integrity Score:</strong> {submission.similarityScore}% (Verified)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
