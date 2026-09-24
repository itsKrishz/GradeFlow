import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Users, 
  Filter,
  BarChart3
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { courses, assignments, submissions, isDarkMode } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Filter assignments by course if selected
  const filteredAssignments = assignments.filter(a => {
    if (selectedCourseId !== 'all' && a.courseId !== selectedCourseId) return false;
    return true;
  });

  const filteredCourses = selectedCourseId === 'all' 
    ? courses 
    : courses.filter(c => c.id === selectedCourseId);

  // Relevant submissions for the selected filter
  const relevantSubmissions = submissions.filter(s => {
    if (selectedCourseId === 'all') return true;
    const asg = assignments.find(a => a.id === s.assignmentId);
    return asg ? asg.courseId === selectedCourseId : false;
  });

  // Evaluated submissions with valid totalScore & maxScore
  const evaluatedSubmissions = relevantSubmissions.filter(
    s => s.evaluationStatus === 'Evaluated' && s.evaluation && s.evaluation.maxScore > 0
  );

  const totalEvaluated = evaluatedSubmissions.length;

  // Calculate Summary Statistics
  let avgPercentageVal = 0;
  let highestPercentageVal = 0;
  let lowestPercentageVal = 100;
  let topStudentInfo = 'No submissions evaluated yet';
  let lowStudentInfo = 'No submissions evaluated yet';
  let passCount = 0;

  if (totalEvaluated > 0) {
    let sumPercentage = 0;
    evaluatedSubmissions.forEach((sub, idx) => {
      const pct = (sub.evaluation!.totalScore / sub.evaluation!.maxScore) * 100;
      sumPercentage += pct;

      if (idx === 0 || pct > highestPercentageVal) {
        highestPercentageVal = pct;
        const asg = assignments.find(a => a.id === sub.assignmentId);
        topStudentInfo = `${sub.studentName} (${asg?.courseCode || 'DBMS'})`;
      }

      if (idx === 0 || pct < lowestPercentageVal) {
        lowestPercentageVal = pct;
        const asg = assignments.find(a => a.id === sub.assignmentId);
        lowStudentInfo = `${sub.studentName} (${pct.toFixed(0)}%)`;
      }

      if (pct >= 50) {
        passCount++;
      }
    });

    avgPercentageVal = sumPercentage / totalEvaluated;
  }

  const summaryStats = {
    averageMarks: totalEvaluated > 0 ? `${avgPercentageVal.toFixed(1)}%` : '—',
    highestScore: totalEvaluated > 0 ? `${highestPercentageVal.toFixed(0)}%` : '—',
    topStudentInfo,
    lowestScore: totalEvaluated > 0 ? `${lowestPercentageVal.toFixed(0)}%` : '—',
    lowStudentInfo: totalEvaluated > 0 ? lowStudentInfo : 'Awaiting evaluations',
    passPercentage: totalEvaluated > 0 ? `${((passCount / totalEvaluated) * 100).toFixed(1)}%` : '—',
    totalEvaluated
  };

  // Grade Distribution Data (A+, A, B+, B, C, F)
  const gradeCounts: Record<string, number> = {
    'A+': 0,
    'A': 0,
    'B+': 0,
    'B': 0,
    'C': 0,
    'F': 0
  };

  evaluatedSubmissions.forEach(sub => {
    const pct = (sub.evaluation!.totalScore / sub.evaluation!.maxScore) * 100;
    if (pct >= 90) gradeCounts['A+']++;
    else if (pct >= 80) gradeCounts['A']++;
    else if (pct >= 70) gradeCounts['B+']++;
    else if (pct >= 60) gradeCounts['B']++;
    else if (pct >= 50) gradeCounts['C']++;
    else gradeCounts['F']++;
  });

  const gradeDistributionData = [
    { grade: 'A+', students: gradeCounts['A+'], color: '#4f46e5' },
    { grade: 'A', students: gradeCounts['A'], color: '#6366f1' },
    { grade: 'B+', students: gradeCounts['B+'], color: '#3b82f6' },
    { grade: 'B', students: gradeCounts['B'], color: '#0ea5e9' },
    { grade: 'C', students: gradeCounts['C'], color: '#f59e0b' },
    { grade: 'F', students: gradeCounts['F'], color: '#ef4444' },
  ];

  // Longitudinal Performance Trend across Sequential Assignments
  const performanceTrendData = filteredAssignments.map(asg => {
    const asgSubs = submissions.filter(s => s.assignmentId === asg.id && s.evaluation && s.evaluation.maxScore > 0);
    if (asgSubs.length === 0) {
      return {
        assignment: asg.title.length > 18 ? `${asg.title.slice(0, 16)}...` : asg.title,
        avgScore: 0,
        highest: 0,
        passing: 0,
        evaluatedCount: 0
      };
    }

    const percentages = asgSubs.map(s => (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100);
    const avgScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const highest = Math.round(Math.max(...percentages));
    const passing = Math.round((percentages.filter(p => p >= 50).length / percentages.length) * 100);

    return {
      assignment: asg.title.length > 18 ? `${asg.title.slice(0, 16)}...` : asg.title,
      avgScore,
      highest,
      passing,
      evaluatedCount: asgSubs.length
    };
  });

  // Assignment Performance Breakdown List
  const assignmentPerformanceList = filteredAssignments.map(asg => {
    const asgSubs = submissions.filter(s => s.assignmentId === asg.id);
    const asgEvalSubs = asgSubs.filter(s => s.evaluation && s.evaluation.maxScore > 0);

    const avgPct = asgEvalSubs.length > 0
      ? `${(asgEvalSubs.reduce((acc, s) => acc + (s.evaluation!.totalScore / s.evaluation!.maxScore) * 100, 0) / asgEvalSubs.length).toFixed(1)}%`
      : '—';

    const subRate = asg.totalStudents > 0
      ? `${Math.round((asg.submittedCount / asg.totalStudents) * 100)}%`
      : (asgSubs.length > 0 ? '100%' : '0%');

    const lateCount = asgSubs.filter(s => s.status === 'Late').length;
    const lateRate = asgSubs.length > 0
      ? `${Math.round((lateCount / asgSubs.length) * 100)}%`
      : '0%';

    const evalRate = asgSubs.length > 0
      ? `${Math.round((asgEvalSubs.length / asgSubs.length) * 100)}%`
      : '—';

    return {
      name: asg.title,
      course: asg.courseCode || 'COURSE',
      avgScore: avgPct,
      submissionRate: subRate,
      lateRate,
      evalCompletion: evalRate
    };
  });

  const gridColor = isDarkMode ? '#1f293d' : '#e2e8f0';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Academic Performance Analytics
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Statistical distribution, longitudinal trends, and rubric evaluation outcomes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Average Marks</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {summaryStats.averageMarks}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{totalEvaluated} graded deliverable{totalEvaluated === 1 ? '' : 's'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Highest Score</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {summaryStats.highestScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium truncate" title={summaryStats.topStudentInfo}>
            {summaryStats.topStudentInfo}
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Lowest Score</span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {summaryStats.lowestScore}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium truncate" title={summaryStats.lowStudentInfo}>
            {summaryStats.lowStudentInfo}
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pass Percentage</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {summaryStats.passPercentage}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {totalEvaluated > 0 ? 'Passing benchmark: >= 50%' : 'Awaiting evaluations'}
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Evaluated Students</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {summaryStats.totalEvaluated}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Across {filteredCourses.length} active course{filteredCourses.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Charts Grid: Grade Distribution & Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Grade Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Number of evaluated students per academic grade band.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Total: {totalEvaluated} Evaluated
            </span>
          </div>

          <div className="h-64 w-full">
            {totalEvaluated === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                <p>No graded submissions available yet to display distribution.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="grade" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#172033' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Student Performance Trend Across Assignments Line Chart */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Student Performance Trend
              </h3>
              <p className="text-xs text-slate-500">
                Class average score progression across sequential assignments.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {performanceTrendData.length} Assignment{performanceTrendData.length === 1 ? '' : 's'} Tracked
            </span>
          </div>

          <div className="h-64 w-full">
            {performanceTrendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                <p>No assignments found for the selected course filter.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="assignment" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#172033' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="avgScore" 
                    name="Class Average (%)" 
                    stroke="#4f46e5" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#4f46e5' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="highest" 
                    name="Top Score (%)" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 3, fill: '#10b981' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Performance Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Assignment Performance & Submission Metrics
          </h3>
          <p className="text-xs text-slate-500">
            Comparative analysis of average scores, completion rates, and late submission frequencies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Assignment Name</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Average Score</th>
                <th className="px-4 py-3">Submission Rate</th>
                <th className="px-4 py-3">Late Percentage</th>
                <th className="px-4 py-3 text-right">Evaluation Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {assignmentPerformanceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No assignments found for the current course selection.
                  </td>
                </tr>
              ) : (
                assignmentPerformanceList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                      {item.course}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.avgScore}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {item.submissionRate}
                    </td>
                    <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">
                      {item.lateRate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.evalCompletion}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
