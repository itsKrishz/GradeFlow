import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Inbox, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileCheck2, 
  Layers, 
  Calendar, 
  Users, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const EvaluationInbox: React.FC = () => {
  const { assignments, submissions, courses } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'late' | 'flagged' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'roster'>('grouped');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // High-level counts from real submissions
  const totalPending = submissions.filter(s => s.evaluationStatus === 'Pending').length;
  const totalLate = submissions.filter(s => s.status === 'Late').length;
  const totalFlagged = submissions.filter(s => s.evaluationStatus === 'Flagged' || (s.similarityScore || 0) >= 30).length;
  const totalCompleted = submissions.filter(s => s.evaluationStatus === 'Evaluated').length;

  // Grouped assignments from real assignments
  const assignmentGroups = assignments.map(a => {
    const asgSubs = submissions.filter(s => s.assignmentId === a.id);
    const pending = asgSubs.filter(s => s.evaluationStatus === 'Pending').length;
    const late = asgSubs.filter(s => s.status === 'Late').length;
    const flagged = asgSubs.filter(s => s.evaluationStatus === 'Flagged' || (s.similarityScore || 0) >= 30).length;
    return {
      id: a.id,
      courseCode: a.courseCode,
      courseName: a.courseName,
      title: a.title,
      pending,
      late,
      flagged,
      total: asgSubs.length,
      dueDate: a.dueDate,
      actionLabel: pending > 0 ? 'Start Evaluation' : 'View Submissions'
    };
  });

  // Flat submissions roster from real submissions
  const allSubmissionsRoster = useMemo(() => {
    return submissions.map(s => {
      const asg = assignments.find(a => a.id === s.assignmentId);
      return {
        id: s.id,
        studentName: s.studentName,
        regNo: s.regNo,
        courseCode: asg?.courseCode || 'N/A',
        assignmentTitle: asg?.title || s.fileName,
        assignmentId: s.assignmentId,
        submittedAt: s.submittedAt,
        status: s.status,
        evaluationStatus: s.evaluationStatus,
        similarityScore: s.similarityScore,
        aiScore: s.aiSuggestedScore || (s.evaluation ? s.evaluation.totalScore : 0),
        maxScore: s.evaluation?.maxScore || asg?.totalMarks || 100
      };
    });
  }, [submissions, assignments]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return allSubmissionsRoster.filter(item => {
      const matchesSearch = 
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'pending') return item.evaluationStatus === 'Pending';
      if (activeFilter === 'late') return item.status === 'Late';
      if (activeFilter === 'flagged') return item.similarityScore > 30 || item.evaluationStatus === 'Flagged';
      if (activeFilter === 'completed') return item.evaluationStatus === 'Evaluated';
      return true;
    });
  }, [allSubmissionsRoster, searchQuery, activeFilter]);

  const totalPages = Math.ceil(filteredRoster.length / pageSize);
  const paginatedRoster = filteredRoster.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
              Evaluation Inbox
            </h2>
            <Badge variant="blue" size="sm">Central Evaluation Workspace</Badge>
          </div>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Triage pending assignment papers, review late submissions, and start individual or batch evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(assignments.length > 0 ? `/teacher/batch-evaluation/${assignments[0].id}` : '/teacher/assignments')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-academic-darkCard border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Open Batch Evaluation</span>
          </button>
          <button
            onClick={() => navigate('/teacher/copilot')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards - Clean Minimalist Academic */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Pending */}
        <div 
          onClick={() => { setActiveFilter('pending'); setViewMode('roster'); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeFilter === 'pending'
              ? 'bg-slate-50 dark:bg-zinc-800/80 border-slate-400 dark:border-zinc-500 shadow-sm'
              : 'bg-white dark:bg-academic-darkCard border-academic-lightBorder dark:border-academic-darkBorder hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalPending}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting grading</div>
        </div>

        {/* Late */}
        <div 
          onClick={() => { setActiveFilter('late'); setViewMode('roster'); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeFilter === 'late'
              ? 'bg-slate-50 dark:bg-zinc-800/80 border-slate-400 dark:border-zinc-500 shadow-sm'
              : 'bg-white dark:bg-academic-darkCard border-academic-lightBorder dark:border-academic-darkBorder hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
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
          <div className="text-[10px] text-slate-400 mt-0.5">Penalty applicable</div>
        </div>

        {/* Flagged */}
        <div 
          onClick={() => { setActiveFilter('flagged'); setViewMode('roster'); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeFilter === 'flagged'
              ? 'bg-slate-50 dark:bg-zinc-800/80 border-slate-400 dark:border-zinc-500 shadow-sm'
              : 'bg-white dark:bg-academic-darkCard border-academic-lightBorder dark:border-academic-darkBorder hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Flagged Overlap
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalFlagged}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Integrity review</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => { setActiveFilter('completed'); setViewMode('roster'); }}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            activeFilter === 'completed'
              ? 'bg-slate-50 dark:bg-zinc-800/80 border-slate-400 dark:border-zinc-500 shadow-sm'
              : 'bg-white dark:bg-academic-darkCard border-academic-lightBorder dark:border-academic-darkBorder hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {totalCompleted}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Grades finalized</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search submissions, students, reg no..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Center: Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'pending', 'late', 'flagged', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                activeFilter === f
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden text-xs shrink-0">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1 font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Grouped by Assignment
          </button>
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3 py-1 font-medium transition-colors ${
              viewMode === 'roster'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Submissions Roster
          </button>
        </div>
      </div>

      {/* VIEW 1: GROUPED BY ASSIGNMENT (THE REQUESTED CORE INBOX VIEW) */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {assignmentGroups.length === 0 ? (
            <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-12 text-center shadow-sm">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Assignments in Inbox</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                No assignments have been created yet. Create an assignment to receive student submissions.
              </p>
              <button
                onClick={() => navigate('/teacher/assignments/create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
              >
                <span>Create Assignment</span>
              </button>
            </div>
          ) : (
            assignmentGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                    {group.courseCode}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{group.courseName}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {group.title}
                </h3>

                {/* Status Badges Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      {group.pending} pending
                    </span>
                  </div>

                  {group.late > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="font-semibold text-rose-700 dark:text-rose-300">
                        {group.late} late
                      </span>
                    </div>
                  )}

                  {group.flagged > 0 && (
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      <span className="font-semibold text-red-700 dark:text-red-300">
                        {group.flagged} flagged
                      </span>
                    </div>
                  )}

                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    Total: {group.total} submissions
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">
                    Due: {group.dueDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => navigate(`/teacher/batch-evaluation/${group.id}`)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  Batch View
                </button>
                <button
                  onClick={() => navigate(`/teacher/evaluation/${group.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
                >
                  <span>{group.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )))}
        </div>
      )}

      {/* VIEW 2: FLAT SUBMISSIONS ROSTER TABLE (REALISTIC SCALE: 1-25 of 128) */}
      {viewMode === 'roster' && (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Filtered Submissions Roster
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Showing {filteredRoster.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredRoster.length)} of {allSubmissionsRoster.length} Total Submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Reg. Number</th>
                  <th className="px-4 py-3">Course / Deliverable</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Similarity</th>
                  <th className="px-4 py-3">AI Score Suggestion</th>
                  <th className="px-4 py-3">Evaluation Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
                {paginatedRoster.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No student submissions found.
                    </td>
                  </tr>
                ) : (
                  paginatedRoster.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {sub.studentName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {sub.regNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{sub.assignmentTitle}</div>
                      <div className="text-[10px] font-mono text-slate-400">{sub.courseCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      {sub.status === 'Late' ? (
                        <Badge variant="rose" size="sm">Late</Badge>
                      ) : (
                        <Badge variant="green" size="sm">On-Time</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {sub.similarityScore > 30 ? (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {sub.similarityScore}% (Flagged)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {sub.similarityScore}% (Clean)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {sub.aiScore} / {sub.maxScore}
                    </td>
                    <td className="px-4 py-3">
                      {sub.evaluationStatus === 'Evaluated' ? (
                        <Badge variant="green" size="sm">Evaluated</Badge>
                      ) : sub.evaluationStatus === 'Flagged' ? (
                        <Badge variant="rose" size="sm">Flagged</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/teacher/evaluation/${sub.assignmentId}`)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 transition-colors"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
