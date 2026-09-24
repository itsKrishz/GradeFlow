import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plus, Search, FileText, ArrowRight, FileCheck2, Calendar, Users, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const Assignments: React.FC = () => {
  const { assignments, courses, deleteAssignment } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [assignmentToDelete, setAssignmentToDelete] = useState<any | null>(null);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'all' || a.courseId === courseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Academic Assignments & Rubrics
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Create structured grading rubrics, set deadlines, and launch batch evaluation workspaces.
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/assignments/create')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Assignment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by assignment title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-academic-primary w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Course:</span>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No assignments created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first assignment and grading rubric to get started with evaluations.
          </p>
          <button
            onClick={() => navigate('/teacher/assignments/create')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                  {assignment.courseCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Due: {assignment.dueDate}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2.5">
                {assignment.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {assignment.description}
              </p>

              <div className="mt-4 pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-[10px] text-slate-400 block font-semibold">SUBMITTED</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{assignment.submittedCount}/{assignment.totalStudents}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-[10px] text-amber-500 block font-semibold">PENDING</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{assignment.pendingCount}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span className="text-[10px] text-emerald-500 block font-semibold">EVALUATED</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{assignment.evaluatedCount}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {assignment.totalMarks} Points • {assignment.rubric.length} Criteria
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Overview
                </button>
                <button
                  onClick={() => navigate(`/teacher/evaluation/${assignment.id}`)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Evaluate</span>
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
          </div>
        ))}
      </div>
      )}

      {/* DELETE ASSIGNMENT CONFIRMATION MODAL */}
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
              This will remove the assignment and all student submissions recorded for it.
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
