import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  BarChart3,
  FileText,
  Settings,
  Users,
  Award,
  TrendingUp,
  Server,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentUser, assignments } = useApp();

  // Find the primary assignment for evaluation workspace link
  const primaryAssignment = assignments[0] || { id: 'assign-1' };

  // Role-based navigation items
  const teacherLinks: NavItem[] = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/inbox', label: 'Evaluation Inbox', icon: Inbox, badge: '37' },
    { to: '/teacher/copilot', label: 'GradeFlow Copilot', icon: Sparkles, badge: 'AI' },
    { to: '/teacher/courses', label: 'Courses', icon: BookOpen },
    { to: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { 
      to: `/teacher/evaluation/${primaryAssignment.id}`, 
      label: 'Workspace', 
      icon: FileCheck2,
      badge: 'Active'
    },
    { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/teacher/reports', label: 'Reports', icon: FileCheck2 },
    { to: '/teacher/settings', label: 'Settings', icon: Settings },
  ];

  const studentLinks: NavItem[] = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: FileText },
    { to: '/student/grades', label: 'Grades & Feedback', icon: Award },
    { to: '/student/performance', label: 'Performance', icon: TrendingUp },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/system', label: 'System Overview', icon: Server },
  ];

  const navLinks = 
    currentUser.role === 'teacher' ? teacherLinks :
    currentUser.role === 'student' ? studentLinks : adminLinks;

  return (
    <aside
      className={`bg-white dark:bg-academic-darkCard border-r border-academic-lightBorder dark:border-academic-darkBorder flex flex-col transition-all duration-200 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              G
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-academic-lightText dark:text-academic-darkText">
                Grade<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
              </span>
              <div className="text-[10px] text-academic-lightMuted dark:text-academic-darkMuted font-medium tracking-wide uppercase">
                Academic Evaluation
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-base mx-auto">
            G
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 text-academic-lightMuted dark:text-academic-darkMuted hover:text-academic-lightText dark:hover:text-academic-darkText hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors ${
            collapsed ? 'mx-auto mt-2 hidden' : ''
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border-l-2 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-colors" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistant indicator / subtle academic badge */}
      {!collapsed && (
        <div className="px-3 py-2.5 mx-3 mb-3 bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg text-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rubric Engine Active</span>
          </div>
          <p className="text-[10px] text-academic-lightMuted dark:text-academic-darkMuted mt-1 leading-normal">
            Teacher supervision required for all automated grading suggestions.
          </p>
        </div>
      )}

      {/* Bottom User Card */}
      <div className="p-3 border-t border-academic-lightBorder dark:border-academic-darkBorder">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
            {currentUser.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-academic-lightText dark:text-academic-darkText truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-academic-lightMuted dark:text-academic-darkMuted capitalize truncate">
                {currentUser.role} • {currentUser.department || 'Computer Science'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
