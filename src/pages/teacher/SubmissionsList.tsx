import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  AlertTriangle, 
  FileCheck2, 
  ArrowRight,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const SubmissionsList: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { assignments, submissions } = useApp();

  const currentAssignmentId = assignmentId || assignments[0]?.id || 'assign-1';
  const assignment = assignments.find(a => a.id === currentAssignmentId) || assignments[0];
  
  const allSubmissions = submissions.filter(s => s.assignmentId === assignment.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Evaluated' | 'Flagged'>('all');

  const filteredSubmissions = allSubmissions.filter(sub => {
    const matchesSearch = 
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.evaluationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400">Assignments /</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{assignment.title}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Student Submissions Roster
          </h2>
        </div>

        <button
          onClick={() => navigate(`/teacher/evaluation/${assignment.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Open in Evaluation Workspace</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-academic-primary w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          {(['all', 'Pending', 'Evaluated', 'Flagged'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {filter === 'all' ? 'All Submissions' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Registration No.</th>
                <th className="px-4 py-3">Submission Time</th>
                <th className="px-4 py-3">Submission Status</th>
                <th className="px-4 py-3">Similarity Score</th>
                <th className="px-4 py-3">Evaluation Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {filteredSubmissions.map((sub) => {
                const isFlagged = sub.similarityScore >= sub.similarityReport.threshold;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {sub.studentName.charAt(0)}
                        </div>
                        <span>{sub.studentName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-8 truncate">{sub.studentEmail}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {sub.regNo}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {sub.submittedAt}
                    </td>

                    <td className="px-4 py-3">
                      {sub.status === 'Submitted' ? (
                        <Badge variant="green" size="sm">Submitted</Badge>
                      ) : sub.status === 'Late' ? (
                        <Badge variant="rose" size="sm">Late</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Missing</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${
                          isFlagged ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {sub.similarityScore}%
                        </span>
                        {isFlagged && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Flagged</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {sub.evaluationStatus === 'Evaluated' ? (
                        <Badge variant="green" size="sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Evaluated {sub.evaluation ? `(${sub.evaluation.totalScore}/${sub.evaluation.maxScore})` : ''}</span>
                        </Badge>
                      ) : sub.evaluationStatus === 'Flagged' ? (
                        <Badge variant="rose" size="sm">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged for Review</span>
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/teacher/evaluation/${assignment.id}?studentId=${sub.studentId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      >
                        <span>Evaluate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
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
