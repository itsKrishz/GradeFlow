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
  const { courses, assignments, isDarkMode } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Summary Metrics
  const summaryStats = {
    averageMarks: '81.4%',
    highestScore: '98%',
    lowestScore: '54%',
    passPercentage: '96.2%',
    totalEvaluated: 114
  };

  // Grade Distribution Data (A+, A, B+, B, C, F)
  const gradeDistributionData = [
    { grade: 'A+', students: 18, color: '#4f46e5' },
    { grade: 'A', students: 34, color: '#6366f1' },
    { grade: 'B+', students: 28, color: '#3b82f6' },
    { grade: 'B', students: 19, color: '#0ea5e9' },
    { grade: 'C', students: 11, color: '#f59e0b' },
    { grade: 'F', students: 4, color: '#ef4444' },
  ];

  // Student Performance Trend across 4 assignments
  const performanceTrendData = [
    { assignment: 'Assignment 1', avgScore: 74, highest: 92, passing: 88 },
    { assignment: 'Assignment 2', avgScore: 78, highest: 95, passing: 91 },
    { assignment: 'Assignment 3', avgScore: 82, highest: 96, passing: 94 },
    { assignment: 'Assignment 4', avgScore: 85, highest: 98, passing: 96 },
  ];

  // Assignment Performance Breakdown
  const assignmentPerformanceList = [
    {
      name: 'Database Schema Design & Normalization',
      course: 'DBMS (CSE2004)',
      avgScore: '83.5%',
      submissionRate: '94%',
      lateRate: '7%',
      evalCompletion: '100%'
    },
    {
      name: 'React & State Architecture Portfolio',
      course: 'Web Tech (CSE3002)',
      avgScore: '79.2%',
      submissionRate: '88%',
      lateRate: '12%',
      evalCompletion: '82%'
    },
    {
      name: 'Divide & Conquer Empirical Benchmarks',
      course: 'Algorithms (CSE2001)',
      avgScore: '86.1%',
      submissionRate: '91%',
      lateRate: '4%',
      evalCompletion: '90%'
    },
    {
      name: 'Concurrency & Semaphore Synchronization Lab',
      course: 'OS (CSE2003)',
      avgScore: '76.8%',
      submissionRate: '85%',
      lateRate: '9%',
      evalCompletion: '75%'
    }
  ];

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
            <span>+3.2% vs last term</span>
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Highest Score</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {summaryStats.highestScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Priya Sharma (DBMS)
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Lowest Score</span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {summaryStats.lowestScore}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Intervention advised
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pass Percentage</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {summaryStats.passPercentage}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            High academic retention
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Evaluated Students</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {summaryStats.totalEvaluated}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Across 4 active courses
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
              Total: 114 Students
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="grade" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} />
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
              Upward Trend (+11%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="assignment" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} domain={[60, 100]} tickLine={false} />
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
              {assignmentPerformanceList.map((item, idx) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
