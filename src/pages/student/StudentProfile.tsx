import React from 'react';
import { useApp } from '../../context/AppContext';
import { User, Mail, GraduationCap, Building2, Calendar, Award } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Academic Student Profile
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Institutional identity and enrolled degree program specifications.
        </p>
      </div>

      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xl text-indigo-700 dark:text-indigo-300">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {currentUser.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Registration No: {currentUser.regNo || 'CSE-2024-042'}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
              Full-time Student in Good Standing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-academic-lightBorder dark:border-academic-darkBorder text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Department</span>
            <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">
              Computer Science & Engineering
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Degree Level</span>
            <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">
              Bachelor of Technology (B.Tech)
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Official Email</span>
            <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">
              {currentUser.email}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Academic Term</span>
            <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">
              Fall 2026 (Semester 5)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
