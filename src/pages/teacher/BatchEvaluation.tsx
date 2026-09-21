import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const BatchEvaluation: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { assignments, submissions, batchApproveSubmissions, showToast } = useApp();
  const navigate = useNavigate();

  const currentAssignment = assignments.find(a => a.id === assignmentId) || assignments[0];

  // Local state for batch rows
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'review' | 'approved' | 'flagged'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Generate realistic batch submissions rows
  const [batchRows, setBatchRows] = useState([
    {
      id: 'sub-batch-1',
      studentName: 'Rahul Kumar',
      regNo: '23BCS001',
      similarity: 4,
      aiScore: '18 / 20',
      numericScore: 18,
      status: 'Review' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Correct 1NF & 2NF decomposition. Minimal loss of transitive justification in 3NF.'
    },
    {
      id: 'sub-batch-2',
      studentName: 'Anjali Menon',
      regNo: '23BCS002',
      similarity: 7,
      aiScore: '16 / 20',
      numericScore: 16,
      status: 'Review' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Complete DDL specifications with foreign key constraints. Missing clustered index benchmark.'
    },
    {
      id: 'sub-batch-3',
      studentName: 'Arjun Nair',
      regNo: '23BCS003',
      similarity: 48,
      aiScore: '—',
      numericScore: 0,
      status: 'Flagged' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'High similarity (48%) with Fall 2025 student submission archive. Manual instructor audit required.'
    },
    {
      id: 'sub-batch-4',
      studentName: 'Priya Sharma',
      regNo: '23BCS004',
      similarity: 3,
      aiScore: '19 / 20',
      numericScore: 19,
      status: 'Approved' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Exemplary submission with comprehensive BCNF lossless join derivation.'
    },
    {
      id: 'sub-batch-5',
      studentName: 'Dev Patel',
      regNo: '23BCS005',
      similarity: 6,
      aiScore: '17 / 20',
      numericScore: 17,
      status: 'Review' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Valid functional dependencies identified. Clean ER diagram specifications.'
    },
    {
      id: 'sub-batch-6',
      studentName: 'Kavya Pillai',
      regNo: '23BCS006',
      similarity: 9,
      aiScore: '18 / 20',
      numericScore: 18,
      status: 'Review' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Strong query indexing with B-Trees. Clean normalized relations.'
    },
    {
      id: 'sub-batch-7',
      studentName: 'Rohan Mehta',
      regNo: '23BCS007',
      similarity: 42,
      aiScore: '—',
      numericScore: 0,
      status: 'Flagged' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Detected 42% textual overlap in BTree insert code with public GitHub repository.'
    },
    {
      id: 'sub-batch-8',
      studentName: 'Ananya Iyer',
      regNo: '23BCS008',
      similarity: 2,
      aiScore: '20 / 20',
      numericScore: 20,
      status: 'Approved' as 'Review' | 'Approved' | 'Flagged',
      reasoning: 'Flawless schema implementation, comprehensive unit tests, and query benchmarks.'
    }
  ]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all non-flagged review rows
      setSelectedIds(filteredRows.filter(r => r.status !== 'Flagged').map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApproveRow = (id: string) => {
    setBatchRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    batchApproveSubmissions([id]);
  };

  const handleFlagRow = (id: string) => {
    setBatchRows(prev => prev.map(r => r.id === id ? { ...r, status: 'Flagged', aiScore: '—' } : r));
    showToast('Submission flagged for academic integrity review.', 'warning');
  };

  const handleApproveSelected = () => {
    if (selectedIds.length === 0) return;
    setBatchRows(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: 'Approved' } : r));
    batchApproveSubmissions(selectedIds);
    setSelectedIds([]);
  };

  // Filtered rows
  const filteredRows = batchRows.filter(row => {
    const matchesSearch = 
      row.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.regNo.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'review') return row.status === 'Review';
    if (filterTab === 'approved') return row.status === 'Approved';
    if (filterTab === 'flagged') return row.status === 'Flagged';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <button
            onClick={() => navigate('/teacher/inbox')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Evaluation Inbox</span>
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
              Batch Evaluation: {currentAssignment?.courseCode} — {currentAssignment?.title}
            </h2>
            <Badge variant="blue" size="sm">Batch Rubric Mode</Badge>
          </div>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Bulk-approve AI-recommended scores or open individual papers for detailed rubric adjustments.
          </p>
        </div>

        {/* Action Header Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-500">Total Deliverables: </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">80 Submissions</span>
          </div>
          <button
            onClick={() => navigate(`/teacher/evaluation/${currentAssignment?.id || 'assign-1'}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <span>Open 3-Column Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-amber-900 dark:text-amber-200">
          <span className="font-bold">Institutional Academic Supervision Requirement:</span>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            AI score recommendations are generated to assist grading velocity and are <strong>NOT automatically final grades</strong>.
            Instructors must verify student solutions against the rubric before approving scores. Flagged submissions require individual audit.
          </p>
        </div>
      </div>

      {/* Control Bar: Filter Tabs, Search, and Batch Approval */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by student name or reg no..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5">
          {(['all', 'review', 'approved', 'flagged'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                filterTab === tab
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Batch Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApproveSelected}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Batch Submissions Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredRows.filter(r => r.status !== 'Flagged').length}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Reg. Number</th>
                <th className="px-4 py-3">Similarity</th>
                <th className="px-4 py-3">AI Score Suggestion</th>
                <th className="px-4 py-3">AI Evaluator Reasoning</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {filteredRows.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr 
                    key={row.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={row.status === 'Flagged'}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {row.regNo}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.similarity > 30 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{row.similarity}%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{row.similarity}%</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {row.aiScore}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={row.reasoning}>
                      {row.reasoning}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'Approved' ? (
                        <Badge variant="green" size="sm">Approved</Badge>
                      ) : row.status === 'Flagged' ? (
                        <Badge variant="rose" size="sm">Flagged</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Review</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.status !== 'Approved' && row.status !== 'Flagged' && (
                          <button
                            onClick={() => handleApproveRow(row.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded transition-colors"
                            title="Approve AI Score"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/teacher/evaluation/${currentAssignment?.id || 'assign-1'}`)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded transition-colors"
                          title="Edit Rubric in Workspace"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {row.status !== 'Flagged' && (
                          <button
                            onClick={() => handleFlagRow(row.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                            title="Flag Submission"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
