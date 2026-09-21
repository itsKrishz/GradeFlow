import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { RubricCriterion } from '../../types';

export const AssignmentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { courses, createAssignment, showToast } = useApp();

  const preselectedCourseId = searchParams.get('courseId') || courses[0]?.id || '';

  // Basic Information
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [description, setDescription] = useState('');
  
  // Deadlines
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [dueTime, setDueTime] = useState('23:59');

  // Submission Rules
  const [allowLate, setAllowLate] = useState(true);
  const [maxSubmissions, setMaxSubmissions] = useState(2);
  const [acceptedFileTypes, setAcceptedFileTypes] = useState<string[]>(['.pdf', '.sql', '.zip']);

  // Rubric Builder
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    {
      id: 'crit-1',
      title: 'Correctness & Requirements Satisfied',
      description: 'Solution meets all mandatory requirements, edge cases, and produces accurate outputs.',
      maxMarks: 10
    },
    {
      id: 'crit-2',
      title: 'Technical Implementation & Structure',
      description: 'Sound architectural design, modular code organization, proper conventions, and error handling.',
      maxMarks: 10
    },
    {
      id: 'crit-3',
      title: 'Documentation & Clarity',
      description: 'Clear README or project report, methodology justification, diagrams, and code comments.',
      maxMarks: 10
    },
    {
      id: 'crit-4',
      title: 'Presentation & Rigor',
      description: 'Formatting consistency, analytical benchmarks, and adherence to academic integrity guidelines.',
      maxMarks: 10
    }
  ]);

  // Live Rubric Total
  const totalRubricMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  const handleAddCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `crit-${Date.now()}`,
      title: 'New Evaluation Criterion',
      description: 'Describe grading expectations and benchmarks...',
      maxMarks: 10
    };
    setCriteria([...criteria, newCriterion]);
  };

  const handleRemoveCriterion = (id: string) => {
    if (criteria.length <= 1) {
      showToast('Assignment must have at least one rubric criterion', 'warning');
      return;
    }
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleUpdateCriterion = (id: string, field: keyof RubricCriterion, value: string | number) => {
    setCriteria(criteria.map(c => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const toggleFileType = (type: string) => {
    if (acceptedFileTypes.includes(type)) {
      if (acceptedFileTypes.length > 1) {
        setAcceptedFileTypes(acceptedFileTypes.filter(t => t !== type));
      }
    } else {
      setAcceptedFileTypes([...acceptedFileTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('Please provide an assignment title', 'error');
      return;
    }

    const selectedCourse = courses.find(c => c.id === courseId) || courses[0];

    createAssignment({
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
      title,
      description,
      dueDate,
      dueTime,
      totalMarks: totalRubricMarks,
      allowLate,
      maxSubmissions,
      acceptedFileTypes,
      rubric: criteria
    });

    navigate(`/teacher/courses/${selectedCourse.id}?tab=assignments`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400">Assignments /</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Create New</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              1. Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assignment Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Consensus Implementation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assignment Description & Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Provide problem formulation, requirements, and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Section 2: Deadline & Submission Rules */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              2. Deadline & Submission Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due Time
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Max Submissions Allowed
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxSubmissions}
                onChange={(e) => setMaxSubmissions(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Late Submissions</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Accepted File Extensions
            </label>
            <div className="flex flex-wrap gap-2">
              {['.pdf', '.zip', '.sql', '.py', '.java', '.docx', '.tar.gz'].map((type) => {
                const selected = acceptedFileTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFileType(type)}
                    className={`px-3 py-1 text-xs font-mono rounded-md border transition-colors ${
                      selected
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Structured Rubric Builder */}
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                3. Structured Evaluation Rubric
              </h3>
            </div>
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800">
              Total Calculated Marks: {totalRubricMarks} Marks
            </div>
          </div>

          <div className="space-y-3">
            {criteria.map((crit, index) => (
              <div
                key={crit.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-bold font-mono text-slate-400 pt-1">
                    #{index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Criterion Title
                      </label>
                      <input
                        type="text"
                        value={crit.title}
                        onChange={(e) => handleUpdateCriterion(crit.id, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Maximum Marks
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={crit.maxMarks}
                        onChange={(e) => handleUpdateCriterion(crit.id, 'maxMarks', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(crit.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                    title="Delete Criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                    Benchmark Description / Scoring Guidance
                  </label>
                  <input
                    type="text"
                    value={crit.description}
                    onChange={(e) => handleUpdateCriterion(crit.id, 'description', e.target.value)}
                    placeholder="Clear benchmarks for grading..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddCriterion}
            className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rubric Criterion</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Assignment with Rubric ({totalRubricMarks} Marks)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
