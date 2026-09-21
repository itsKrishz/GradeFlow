import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, GraduationCap, BookOpen, FileText, Server, ShieldCheck, Activity } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const { courses, assignments, enrolledStudents } = useApp();

  const totalStudents = 240;
  const totalTeachers = 18;
  const totalCourses = courses.length;
  const totalAssignments = assignments.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Institutional Administration Dashboard
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          System health, institutional metrics, faculty distribution, and evaluation telemetry.
        </p>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Students</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalStudents}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Enrolled across 6 departments
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Teachers</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {totalTeachers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active faculty evaluators
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Courses</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 rounded text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalCourses}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fall 2026 Academic Term
          </p>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Assignments</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 rounded text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {totalAssignments}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            184 total student submissions
          </p>
        </div>
      </div>

      {/* System Health & Status */}
      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Platform Infrastructure Status
            </h3>
          </div>
          <Badge variant="green" size="sm">All Systems Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Plagiarism Cross-Check Queue</span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">0 Tasks Pending</div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Average latency: 420ms</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Database Connection Pool</span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">12 / 64 Active</div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">PostgreSQL 16 Cluster</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Storage Volume Utilization</span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">4.2 GB / 500 GB</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Encrypted artifact storage</p>
          </div>
        </div>
      </div>
    </div>
  );
};
