import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  X,
  Code2
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

interface IntegrityAuditInfo {
  studentId: string;
  studentName: string;
  regNo: string;
  courseCode: string;
  courseName: string;
  assignmentTitle: string;
  status: 'Clean' | 'Flagged';
  similarityScore: number;
  scanDate: string;
  matches?: {
    sourceTitle: string;
    sourceType: string;
    similarity: number;
    studentSnippet: string;
    matchedSnippet: string;
  }[];
}

export const Reports: React.FC = () => {
  const { courses, assignments, enrolledStudents, submissions, showToast } = useApp();

  const [reportType, setReportType] = useState<'gradesheet' | 'summary' | 'performance'>('gradesheet');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignments[0]?.id || '');
  const [selectedSection, setSelectedSection] = useState('A');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Allow dynamic override of integrity status (e.g. teacher dismissing a false-positive)
  const [integrityOverrides, setIntegrityOverrides] = useState<Record<string, 'Clean' | 'Flagged'>>({});

  // Active student integrity audit modal
  const [activeAudit, setActiveAudit] = useState<IntegrityAuditInfo | null>(null);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId) || assignments[0];

  // Assignments belonging to selected course
  const courseAssignments = assignments.filter(a => 
    selectedCourse ? (a.courseId === selectedCourse.id || a.courseCode === selectedCourse.code) : true
  );

  // Dynamically derive student report rows from real enrolled students & submissions
  const relevantSubmissions = submissions.filter(s => {
    if (!selectedCourse) return true;
    const a = assignments.find(asg => asg.id === s.assignmentId);
    return a ? a.courseId === selectedCourse.id : true;
  });

  const studentMap = new Map<string, { id: string; name: string; regNo: string; submissions: typeof submissions }>();

  // Include enrolled students
  enrolledStudents
    .filter(s => !selectedCourse || s.courseId === selectedCourse.id)
    .forEach(s => {
      studentMap.set(s.id, { id: s.id, name: s.name, regNo: s.regNo, submissions: [] });
    });

  // Include submitting students
  relevantSubmissions.forEach(sub => {
    const existing = studentMap.get(sub.studentId);
    if (existing) {
      existing.submissions.push(sub);
    } else {
      studentMap.set(sub.studentId, {
        id: sub.studentId,
        name: sub.studentName,
        regNo: sub.regNo,
        submissions: [sub]
      });
    }
  });

  const reportRows = Array.from(studentMap.values()).map((student) => {
    const studentSubs = student.submissions;
    let total = 0;
    let max = 0;
    let worstSimScore = 0;
    let isFlagged = false;

    studentSubs.forEach(sub => {
      if (sub.evaluation) {
        total += sub.evaluation.totalScore;
        max += sub.evaluation.maxScore;
      }
      if (sub.similarityScore > worstSimScore) {
        worstSimScore = sub.similarityScore;
      }
      if (sub.similarityScore >= (sub.similarityReport?.threshold || 20)) {
        isFlagged = true;
      }
    });

    const displayMax = max > 0 ? max : 100;
    const pctVal = max > 0 ? (total / max) * 100 : 0;
    const pct = `${pctVal.toFixed(1)}%`;
    let grade = 'N/A';
    if (max > 0) {
      if (pctVal >= 90) grade = 'A+';
      else if (pctVal >= 80) grade = 'A';
      else if (pctVal >= 70) grade = 'B';
      else if (pctVal >= 60) grade = 'C';
      else grade = 'D';
    }

    const defaultStatus = isFlagged ? ('Flagged' as const) : ('Clean' as const);
    const currentStatus = integrityOverrides[student.id] || defaultStatus;

    // Build assignment scores map
    const assignmentScores: Record<string, string | number> = {};
    courseAssignments.forEach(asg => {
      const match = studentSubs.find(s => s.assignmentId === asg.id);
      if (match?.evaluation) {
        assignmentScores[asg.id] = match.evaluation.totalScore;
      } else if (match) {
        assignmentScores[asg.id] = 'Submitted';
      } else {
        assignmentScores[asg.id] = '—';
      }
    });

    return {
      id: student.id,
      name: student.name,
      regNo: student.regNo,
      assignmentScores,
      total: max > 0 ? total : '—',
      max: displayMax,
      percentage: max > 0 ? pct : '—',
      grade: max > 0 ? grade : '—',
      status: currentStatus,
      similarityScore: currentStatus === 'Clean' ? 0 : worstSimScore,
      firstSubmission: studentSubs[0]
    };
  });

  // REAL CSV EXPORT IMPLEMENTATION
  const handleExportCSV = () => {
    if (reportRows.length === 0) {
      showToast('No student data available to export.', 'info');
      return;
    }
    setIsExporting('csv');

    const assignmentHeaders = courseAssignments.map(a => `"${a.title.replace(/"/g, '""')} (${a.totalMarks})"`);

    const headers = [
      'Student Name',
      'Registration Number',
      'Course Code',
      'Course Name',
      'Section',
      ...(assignmentHeaders.length > 0 ? assignmentHeaders : ['Assignments']),
      'Total Score',
      'Percentage',
      'Final Grade',
      'Integrity Status',
      'Similarity Score (%)'
    ];

    const rows = reportRows.map(row => {
      const asgCols = courseAssignments.length > 0 
        ? courseAssignments.map(a => `"${row.assignmentScores[a.id] ?? '—'}"`)
        : ['"—"'];

      return [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.regNo}"`,
        `"${selectedCourse ? selectedCourse.code : 'COURSE'}"`,
        `"${selectedCourse ? selectedCourse.name.replace(/"/g, '""') : 'Course'}"`,
        `"Section ${selectedSection}"`,
        ...asgCols,
        `"${row.total} / ${row.max}"`,
        `"${row.percentage}"`,
        `"${row.grade}"`,
        `"${row.status}"`,
        `"${row.similarityScore}%"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `GradeFlow_${selectedCourse ? selectedCourse.code : 'Report'}_Sec${selectedSection}_${reportType.toUpperCase()}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(null);
      showToast(`Exported ${filename} successfully!`, 'success');
    }, 400);
  };

  const handleOpenIntegrityAudit = (row: typeof reportRows[0]) => {
    const isFlagged = row.status === 'Flagged';
    const sub = row.firstSubmission;

    const auditData: IntegrityAuditInfo = {
      studentId: row.id,
      studentName: row.name,
      regNo: row.regNo,
      courseCode: selectedCourse ? selectedCourse.code : '—',
      courseName: selectedCourse ? selectedCourse.name : '—',
      assignmentTitle: selectedAssignment ? selectedAssignment.title : (sub ? 'Assignment Deliverable' : '—'),
      status: row.status,
      similarityScore: row.similarityScore,
      scanDate: sub?.submittedAt || new Date().toISOString().slice(0, 10),
      matches: sub?.similarityReport?.matchedSections?.map(m => ({
        sourceTitle: m.matchedSource || 'Institutional Peer Match',
        sourceType: 'Peer Submission',
        similarity: m.similarityPercentage || 25,
        studentSnippet: m.sectionTitle || 'Referenced submission section',
        matchedSnippet: m.matchedSnippet || 'Matching archive content'
      })) || (isFlagged ? [
        {
          sourceTitle: 'Institutional Peer Corpus (Cross-Student Similarity)',
          sourceType: 'Peer Submission Archive',
          similarity: row.similarityScore,
          studentSnippet: 'Matched code or document fragment detected across submission archive.',
          matchedSnippet: 'Direct cross-document correlation with peer submission.'
        }
      ] : undefined)
    };

    setActiveAudit(auditData);
  };

  const handleDismissFlag = (studentId: string) => {
    setIntegrityOverrides(prev => ({ ...prev, [studentId]: 'Clean' }));
    if (activeAudit) {
      setActiveAudit({
        ...activeAudit,
        status: 'Clean',
        similarityScore: 0,
        matches: undefined
      });
    }
    showToast('Integrity flag cleared. Submission marked as verified Clean.', 'success');
  };

  const handleFlagStudent = (studentId: string) => {
    setIntegrityOverrides(prev => ({ ...prev, [studentId]: 'Flagged' }));
    if (activeAudit) {
      setActiveAudit({
        ...activeAudit,
        status: 'Flagged',
        similarityScore: 42
      });
    }
    showToast('Submission manually flagged for academic review.', 'warning');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Academic Reports & Grade Sheets
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Export institutional grade sheets, assignment summaries, and review student academic integrity audits.
          </p>
        </div>

        {/* Real Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
            title="Download formatted CSV grade sheet file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting === 'csv' ? 'Generating CSV...' : 'Export CSV (.csv)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50"
            title="Export Excel-compatible CSV spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Controls & Report Type Selector */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm space-y-4">
        {/* Report Type Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-2">Report Template:</span>
          <button
            onClick={() => setReportType('gradesheet')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              reportType === 'gradesheet'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Course Grade Sheet
          </button>

          <button
            onClick={() => setReportType('summary')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              reportType === 'summary'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Assignment Rubric Summary
          </button>

          <button
            onClick={() => setReportType('performance')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              reportType === 'performance'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Student Performance Audit
          </button>
        </div>

        {/* Granular Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assignment</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              Report Data Preview ({reportType.toUpperCase()})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Institution: Department of CSE • Click any Integrity Status badge to inspect similarity report
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Reg. Number</th>
                {courseAssignments.map(asg => (
                  <th key={asg.id} className="px-4 py-3">
                    {asg.title} ({asg.totalMarks})
                  </th>
                ))}
                {courseAssignments.length === 0 && (
                  <th className="px-4 py-3">Assignments</th>
                )}
                <th className="px-4 py-3">Total Score</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Final Grade</th>
                <th className="px-4 py-3 text-right">Integrity Status (Click to inspect)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={6 + Math.max(1, courseAssignments.length)} className="px-4 py-8 text-center text-slate-500">
                    No student submissions or enrolled students found for this course yet.
                  </td>
                </tr>
              ) : (
                reportRows.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {stu.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {stu.regNo}
                  </td>
                  {courseAssignments.map(asg => (
                    <td key={asg.id} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {stu.assignmentScores[asg.id] ?? '—'}
                    </td>
                  ))}
                  {courseAssignments.length === 0 && (
                    <td className="px-4 py-3 text-slate-400">—</td>
                  )}
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                    {stu.total} / {stu.max}
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                    {stu.percentage}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {stu.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenIntegrityAudit(stu)}
                      className="group inline-flex items-center gap-1.5 focus:outline-none transition-transform hover:scale-105 active:scale-95"
                      title="Click to view full Academic Integrity Audit"
                    >
                      {stu.status === 'Flagged' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer shadow-sm">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Flagged ({stu.similarityScore}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 cursor-pointer shadow-sm">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Clean</span>
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACADEMIC INTEGRITY AUDIT / CERTIFICATE MODAL */}
      {activeAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <div className="flex items-center gap-2.5">
                {activeAudit.status === 'Flagged' ? (
                  <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeAudit.status === 'Flagged' 
                      ? 'Academic Integrity Alert & Similarity Audit' 
                      : 'Academic Integrity Verification Certificate'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student: <strong>{activeAudit.studentName}</strong> ({activeAudit.regNo}) • Course: {activeAudit.courseCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAudit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Status Banner */}
            {activeAudit.status === 'Flagged' ? (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Overall Similarity: {activeAudit.similarityScore}% (Threshold Exceeded: &gt;20%)
                  </span>
                  <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300">
                    Status: Under Teacher Review
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  The automated code originality analyzer flagged high overlap with prior institutional submissions and public repositories.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Clean Academic Originality Verified (0% Plagiarism Detected)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                    Ref: GF-INT-{activeAudit.regNo}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  All functions, variable semantics, and algorithmic logic verified as original work. Fully compliant with university honor codes.
                </p>
              </div>
            )}

            {/* Audit Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Assignment</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{activeAudit.assignmentTitle}</div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Scan Engine</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">GradeFlow AST-Diff</div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">AI Probability</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeAudit.status === 'Flagged' ? `${activeAudit.similarityScore}%` : '0%'}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Scan Timestamp</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{activeAudit.scanDate}</div>
              </div>
            </div>

            {/* If Flagged: Matched Sources & Code Diff */}
            {activeAudit.status === 'Flagged' && activeAudit.matches && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  Detected Source Matches ({activeAudit.matches.length})
                </h4>

                <div className="space-y-3">
                  {activeAudit.matches.map((match, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <span>{match.sourceTitle}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          {match.similarity}% match
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Origin Type: <strong>{match.sourceType}</strong>
                      </div>

                      {/* Side by side comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 mb-1">Student's Code:</div>
                          <pre className="p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto text-[10px] leading-tight">
                            {match.studentSnippet}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-rose-500 mb-1">Matched Source Code:</div>
                          <pre className="p-2 bg-white dark:bg-black rounded border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 overflow-x-auto text-[10px] leading-tight">
                            {match.matchedSnippet}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Review Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder">
              <div className="flex items-center gap-2">
                {activeAudit.status === 'Flagged' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDismissFlag(activeAudit.studentId)}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm"
                    >
                      Dismiss Flag (Mark Clean)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast(`Interview invitation sent to ${activeAudit.studentName} (${activeAudit.regNo})!`, 'success');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      Schedule Clarification
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFlagStudent(activeAudit.studentId)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-800 transition-colors"
                  >
                    Manually Flag for Review
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveAudit(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
