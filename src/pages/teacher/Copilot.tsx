import React from 'react';
import { CopilotChat } from '../../components/copilot/CopilotChat';
import { 
  Sparkles, 
  History, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  HelpCircle,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Copilot: React.FC = () => {
  const { assignments, courses, submissions } = useApp();

  const totalPending = assignments.reduce((acc, a) => acc + a.pendingCount, 0);
  const totalFlagged = submissions.filter(s => s.similarityScore > 30).length;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-black">
      {/* Left Sidebar: Context & Capability Pinned Topics */}
      <div className="hidden lg:flex w-72 bg-white dark:bg-academic-darkCard border-r border-academic-lightBorder dark:border-academic-darkBorder flex-col justify-between shrink-0">
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Status Header */}
          <div className="space-y-1.5 pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Academic Copilot Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Integrated with {courses.length} active courses and {submissions.length} student submissions.
            </p>
          </div>

          {/* Academic Snapshot */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Live Evaluation Metrics
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500">Pending Papers</div>
                <div className="font-bold text-sm text-amber-600 dark:text-amber-400 font-mono">
                  {totalPending}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500">Flagged Overlap</div>
                <div className="font-bold text-sm text-rose-600 dark:text-rose-400 font-mono">
                  {totalFlagged}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Query Topics */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <History className="w-3 h-3" />
              <span>Recent Academic Topics</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors truncate">
                DBMS — Normalization Project Rubric
              </div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors truncate">
                Pending Submissions Roster Audit
              </div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors truncate">
                Arjun Nair (42% Plagiarism Overlap)
              </div>
              <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors truncate">
                Assignment 3 Grade Distribution
              </div>
            </div>
          </div>

          {/* Safe Academic Principles Guardrails */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg space-y-1.5 text-xs">
            <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academic Safeguards</span>
            </div>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-normal">
              Copilot requires instructor confirmation for dangerous actions and never automatically publishes grades without teacher verification.
            </p>
          </div>
        </div>

        {/* Bottom Help */}
        <div className="p-3 border-t border-academic-lightBorder dark:border-academic-darkBorder text-[11px] text-slate-500">
          Tip: You can press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Cmd + K</kbd> anywhere to open Copilot sidebar.
        </div>
      </div>

      {/* Main Conversational Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <CopilotChat compactMode={false} />
      </div>
    </div>
  );
};
