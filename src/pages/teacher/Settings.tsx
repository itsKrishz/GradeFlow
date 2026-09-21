import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings as SettingsIcon, Save, ShieldAlert, Award, Sliders, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [similarityThreshold, setSimilarityThreshold] = useState(30);
  const [allowLateSubmissionsDefault, setAllowLateSubmissionsDefault] = useState(true);
  const [autoDraftSave, setAutoDraftSave] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform preferences updated successfully', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Teacher Evaluation Settings
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Configure default rubric bounds, academic integrity thresholds, and notification triggers.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Similarity Thresholds */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Academic Similarity Detection Engine
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plagiarism Review Flagging Threshold
              </label>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {similarityThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Submissions matching or exceeding this percentage will be prominently flagged with a warning banner in the Evaluation Workspace for teacher review.
            </p>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        {/* Grading Scale Scheme */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Institutional Grade Scale
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">A+</span>
              <p className="text-[10px] text-slate-500 mt-1">90% – 100%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">A</span>
              <p className="text-[10px] text-slate-500 mt-1">80% – 89%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">B+</span>
              <p className="text-[10px] text-slate-500 mt-1">70% – 79%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">B</span>
              <p className="text-[10px] text-slate-500 mt-1">60% – 69%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">C</span>
              <p className="text-[10px] text-slate-500 mt-1">50% – 59%</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-rose-600 dark:text-rose-400">F</span>
              <p className="text-[10px] text-slate-500 mt-1">Below 50%</p>
            </div>
          </div>
        </div>

        {/* Workspace Preferences */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Workspace Defaults
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowLateSubmissionsDefault}
                onChange={(e) => setAllowLateSubmissionsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Allow late submissions by default for new assignments
                </p>
                <p className="text-[11px] text-slate-500">
                  Students can upload past deadline, automatically flagged as Late for grading review.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                checked={autoDraftSave}
                onChange={(e) => setAutoDraftSave(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Auto-save draft rubrics when switching students
                </p>
                <p className="text-[11px] text-slate-500">
                  Ensures partially completed rubric marks and qualitative feedback are never lost.
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
