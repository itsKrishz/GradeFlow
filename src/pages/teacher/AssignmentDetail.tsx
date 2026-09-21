import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  Users, 
  Calendar, 
  Award,
  ArrowRight,
  ListFilter
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AssignmentDetail: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { assignments, submissions } = useApp();

  const assignment = assignments.find(a => a.id === assignmentId) || assignments[0];
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/teacher/assignments')}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400">Assignments /</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{assignment.title}</span>
      </div>

      {/* Main Details Banner */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                {assignment.courseCode}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {assignment.courseName}
              </span>
              <Badge variant="blue" size="sm">{assignment.status}</Badge>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {assignment.title}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Launch Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => navigate(`/teacher/evaluation/${assignment.id}`)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Launch Evaluation Workspace</span>
            </button>
            <button
              onClick={() => navigate(`/teacher/submissions/${assignment.id}`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ListFilter className="w-4 h-4" />
              <span>View Submissions Table</span>
            </button>
          </div>
        </div>

        {/* 5 Submission Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-academic-lightBorder dark:border-academic-darkBorder">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Students</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {assignment.totalStudents}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Submitted</span>
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {assignment.submittedCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Grading</span>
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {assignment.pendingCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Late Submissions</span>
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {assignment.lateCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Evaluated</span>
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {assignment.evaluatedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Rubric Specifications + Submission Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rubric Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Structured Evaluation Rubric ({assignment.rubric.length} Criteria)</span>
            </h3>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              Total: {assignment.totalMarks} Marks
            </span>
          </div>

          <div className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
            {assignment.rubric.map((criterion, idx) => (
              <div key={criterion.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-400">#{idx + 1}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {criterion.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {criterion.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {criterion.maxMarks}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Rules & Meta (1 col) */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            Rules & Deadlines
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Final Deadline</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {assignment.dueDate} at {assignment.dueTime}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Late Submission Policy</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {assignment.allowLate ? 'Allowed (Flagged with penalty warning)' : 'Strictly Prohibited'}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Maximum Attempts</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {assignment.maxSubmissions} Submissions
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Accepted File Extensions</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {assignment.acceptedFileTypes.map((ext) => (
                  <span
                    key={ext}
                    className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
