import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  FilePlus, 
  FileCheck2, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const TeacherDashboard: React.FC = () => {
  const { assignments, courses } = useApp();
  const navigate = useNavigate();

  // Aggregate statistics across assignments
  const totalPending = assignments.reduce((acc, a) => acc + a.pendingCount, 0);
  const totalEvaluated = assignments.reduce((acc, a) => acc + a.evaluatedCount, 0);
  const totalLate = assignments.reduce((acc, a) => acc + a.lateCount, 0);
  const totalActiveCourses = courses.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Academic Evaluation Overview
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Monitor submission progress, pending rubrics, and student performance metrics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/teacher/courses?action=create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Course</span>
          </button>

          <button
            onClick={() => navigate('/teacher/assignments/create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Create Assignment</span>
          </button>

          <button
            onClick={() => navigate(`/teacher/evaluation/${assignments[0]?.id || 'assign-1'}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Start Evaluation</span>
          </button>
        </div>
      </div>

      {/* 4 Key Statistics Cards - Clean, Minimalist, Academic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pending Evaluations */}
        <div 
          onClick={() => navigate('/teacher/inbox')}
          className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Evaluations
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalPending}
          </div>
        </div>

        {/* Completed Evaluations */}
        <div 
          onClick={() => navigate('/teacher/inbox')}
          className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed Evaluations
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalEvaluated}
          </div>
        </div>

        {/* Late Submissions */}
        <div 
          onClick={() => navigate('/teacher/inbox')}
          className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Late Submissions
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalLate}
          </div>
        </div>

        {/* Active Courses */}
        <div 
          onClick={() => navigate('/teacher/courses')}
          className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Courses
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalActiveCourses}
          </div>
        </div>
      </div>

      {/* Recent Assignments Table - Extended Full Width */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm">
        <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-academic-lightText dark:text-academic-darkText">
              Recent Assignments
            </h3>
            <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted">
              Monitor submission completion rates and start batch rubric grading.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/assignments')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-academic-lightMuted dark:text-academic-darkMuted border-b border-academic-lightBorder dark:border-academic-darkBorder font-medium">
              <tr>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {assignments.map((assignment) => (
                <tr 
                  key={assignment.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="truncate max-w-xs">{assignment.title}</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Total Marks: {assignment.totalMarks} • {assignment.rubric.length} Criteria
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      {assignment.courseCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {assignment.dueDate}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {assignment.submittedCount}/{assignment.totalStudents}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        ({assignment.pendingCount} pending)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="blue" size="sm">
                      {assignment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/teacher/evaluation/${assignment.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      >
                        Evaluate
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="View Details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
