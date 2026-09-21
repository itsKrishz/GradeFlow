import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Award, CheckCircle2, BookOpen } from 'lucide-react';

export const StudentPerformance: React.FC = () => {
  const { isDarkMode, currentUser } = useApp();

  const performanceTrendData = [
    { assignment: 'Assignment 1', score: 82, classAvg: 74 },
    { assignment: 'Assignment 2', score: 85, classAvg: 78 },
    { assignment: 'Assignment 3', score: 90, classAvg: 81 },
    { assignment: 'Assignment 4', score: 94, classAvg: 85 },
  ];

  const courseBreakdown = [
    { course: 'Database Management Systems', code: 'CSE2004', grade: 'A', score: '88%' },
    { course: 'Web Programming & Modern Frameworks', code: 'CSE3002', grade: 'A+', score: '94%' },
    { course: 'Design & Analysis of Algorithms', code: 'CSE2001', grade: 'B+', score: '78%' },
    { course: 'Operating Systems & Distributed Architecture', code: 'CSE2003', grade: 'A', score: '86%' },
  ];

  const gridColor = isDarkMode ? '#1f293d' : '#e2e8f0';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Academic Performance Overview
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Longitudinal grade trend and subject-specific competency milestones.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Cumulative Average</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            86.5%
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Top 10% in CSE Section A</span>
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Current Grade Standing</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Grade A (Distinction)
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across 4 Enrolled Courses
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Completed Evaluations</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            100% on-time
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Zero integrity flags detected
          </p>
        </div>
      </div>

      {/* Grade Trend Line Chart */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grade Trend Across Assignments
            </h3>
            <p className="text-xs text-slate-500">
              Comparison between your scores and class median performance.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Progressing Upward
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
              <Line 
                type="monotone" 
                dataKey="score" 
                name="Your Score (%)" 
                stroke="#4f46e5" 
                strokeWidth={2.5} 
                dot={{ r: 5, fill: '#4f46e5' }} 
              />
              <Line 
                type="monotone" 
                dataKey="classAvg" 
                name="Class Average (%)" 
                stroke="#94a3b8" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={{ r: 3, fill: '#94a3b8' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-academic-lightBorder dark:border-academic-darkBorder">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Course Performance Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {courseBreakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {item.course}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {item.code}
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {item.score}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      Grade {item.grade}
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
