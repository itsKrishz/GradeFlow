import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { BookOpen, Users, FileText, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminCourses: React.FC = () => {
  const { courses, deleteCourse } = useApp();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          Institute Course Catalog
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Campus-wide academic offerings, assigned instructors, and student enrollment quotas.
        </p>
      </div>

      <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-medium border-b border-academic-lightBorder dark:border-academic-darkBorder">
              <tr>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-4 py-3">Course Title</th>
                <th className="px-4 py-3">Assigned Faculty</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Enrollment</th>
                <th className="px-4 py-3">Enrollment Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-academic-lightBorder dark:divide-academic-darkBorder">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {course.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {course.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {course.teacherName || 'Faculty Instructor'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    Section {course.section}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                    {course.studentsCount} Students
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {course.enrollmentCode}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="green" size="sm">Active</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setCourseToDelete(course)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Academic Course
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>{courseToDelete.code} – {courseToDelete.name}</strong>? 
              This will remove the course, student rosters, and all associated assignments.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
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
