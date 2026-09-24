import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Copy, 
  Check, 
  Users, 
  FileText, 
  ArrowRight, 
  Search,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const Courses: React.FC = () => {
  const { courses, createCourse, deleteCourse, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    section: 'A',
    semester: 'Fall 2026',
    academicYear: '2026-2027',
    description: ''
  });

  // Auto-open modal if ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Enrollment code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    createCourse({
      name: formData.name,
      code: formData.code.toUpperCase(),
      section: formData.section,
      semester: formData.semester,
      academicYear: formData.academicYear,
      description: formData.description
    });

    setShowCreateModal(false);
    setFormData({
      name: '',
      code: '',
      section: 'A',
      semester: 'Fall 2026',
      academicYear: '2026-2027',
      description: ''
    });
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.enrollmentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            Course Management
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Organize academic courses, student rosters, and assignment evaluation criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-academic-primary w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Courses Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery ? 'No courses match your search criteria.' : 'You have not created any courses yet. Create your first academic course to manage enrollments and assignments.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                      {course.code}
                    </span>
                    <span className="text-xs text-academic-lightMuted dark:text-academic-darkMuted font-medium">
                      Section {course.section}
                    </span>
                  </div>

                  {/* Enrollment Code Pill */}
                  <button
                    onClick={() => handleCopyCode(course.enrollmentCode)}
                    className="flex items-center gap-1 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Click to copy enrollment code"
                  >
                    <span>Code: {course.enrollmentCode}</span>
                    {copiedCode === course.enrollmentCode ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'Comprehensive curriculum covering foundational principles and practical labs.'}
                </p>

                {/* Course Meta Info */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-academic-lightBorder dark:border-academic-darkBorder">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span><strong>{course.studentsCount}</strong> Enrolled Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span><strong>{course.activeAssignmentsCount}</strong> Active Assignments</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
                <span className="text-[11px] text-academic-lightMuted dark:text-academic-darkMuted font-medium">
                  {course.semester} • {course.academicYear}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/teacher/courses/${course.id}?tab=students`)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Students
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/courses/${course.id}?tab=assignments`)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Assignments
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                  >
                    <span>Overview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCourseToDelete(course)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-none">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Create New Academic Course
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Course Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE4012"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs uppercase font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Section / Batch
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Fall 2026">Fall 2026</option>
                    <option value="Spring 2027">Spring 2027</option>
                    <option value="Summer 2027">Summer 2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline topics, objectives, and laboratory requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                >
                  Create & Generate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE COURSE CONFIRMATION MODAL */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Delete Course
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{courseToDelete.name} ({courseToDelete.code})</strong>? 
              This will also remove all associated student assignments and submissions.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
