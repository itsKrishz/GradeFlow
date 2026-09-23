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
    { to: '/teacher/inbox', label: 'Inbox', icon: Inbox, badge: '37' },
    { to: '/teacher/copilot', label: 'Copilot', icon: Sparkles, badge: 'AI' },
    { to: '/teacher/courses', label: 'Courses', icon: BookOpen },
    { to: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { 
      to: `/teacher/evaluation/${primaryAssignment.id}`, 
      label: 'Workspace', 
      icon: FileCheck2
    },
    { to: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/teacher/reports', label: 'Reports', icon: FileCheck2 },
    { to: '/teacher/settings', label: 'Settings', icon: Settings },
  ];

  const studentLinks: NavItem[] = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: FileText },
    { to: '/student/grades', label: 'Grades', icon: Award },
    { to: '/student/performance', label: 'Performance', icon: TrendingUp },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/system', label: 'System', icon: Server },
  ];

  const navLinks = 
    currentUser.role === 'teacher' ? teacherLinks :
    currentUser.role === 'student' ? studentLinks : adminLinks;

  return (
    <aside
      className={`bg-white dark:bg-academic-darkCard border-r border-academic-lightBorder dark:border-academic-darkBorder flex flex-col transition-all duration-200 z-40 shrink-0 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm">
                G
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Grade<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
              </span>
            </div>

            <button
              onClick={onToggleCollapse}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs hover:opacity-80 transition-opacity"
              title="Click to expand sidebar"
            >
              G
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
                  isActive
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-zinc-800/50 font-medium'
                } ${collapsed ? 'justify-center px-1.5' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.2 rounded border border-slate-200 dark:border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>



      {/* Bottom User Profile */}
      <div className="p-2 border-t border-academic-lightBorder dark:border-academic-darkBorder">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 shrink-0 flex items-center justify-center font-bold text-[11px]">
            {currentUser.name.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {currentUser.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
