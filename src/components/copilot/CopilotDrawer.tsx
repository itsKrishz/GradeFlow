import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CopilotChat } from './CopilotChat';
import { X, Maximize2, Sparkles } from 'lucide-react';

export const CopilotDrawer: React.FC = () => {
  const { isCopilotOpen, closeCopilot } = useApp();
  const navigate = useNavigate();

  if (!isCopilotOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        onClick={closeCopilot}
        className="absolute inset-0 bg-slate-900/40 transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-academic-darkCard border-l border-academic-lightBorder dark:border-academic-darkBorder shadow-2xl flex flex-col">
          {/* Drawer Top Controls */}
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>GradeFlow Copilot</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Sidebar Mode</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  closeCopilot();
                  navigate('/teacher/copilot');
                }}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Open in Full Page Workspace"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeCopilot}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Chat Canvas */}
          <div className="flex-1 min-h-0">
            <CopilotChat compactMode={true} onNavigateAction={closeCopilot} />
          </div>
        </div>
      </div>
    </div>
  );
};
