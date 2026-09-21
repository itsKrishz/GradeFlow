import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  UserCheck, 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown,
  Sparkles,
  FileText,
  FileCheck2,
  Clock,
  AlertTriangle,
  Check,
  Inbox
} from 'lucide-react';
import { Role } from '../../types';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
  const { 
    isDarkMode, 
    toggleTheme, 
    currentUser, 
    switchRole, 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    openCopilot 
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');

  // Keyboard shortcut: Cmd+K / Ctrl+K opens Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCopilot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCopilot]);

  // Compute clean breadcrumb / page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/teacher/copilot')) return 'GradeFlow Copilot';
    if (path.includes('/teacher/inbox')) return 'Evaluation Inbox';
    if (path.includes('/teacher/batch-evaluation')) return 'Batch Evaluation';
    if (path.includes('/evaluation/')) return 'Evaluation Workspace';
    if (path.includes('/assignments/create')) return 'Create Assignment';
    if (path.includes('/assignments/')) return 'Assignment Details';
    if (path.includes('/courses/')) return 'Course Overview';
    if (path === '/teacher/courses' || path === '/student/courses') return 'Courses';
    if (path === '/teacher/assignments') return 'Assignments';
    if (path === '/teacher/analytics') return 'Analytics & Insights';
    if (path === '/teacher/reports') return 'Academic Reports';
    if (path === '/teacher/settings') return 'Platform Settings';
    if (path === '/student/dashboard') return 'Student Dashboard';
    if (path === '/student/grades') return 'My Grades & Feedback';
    if (path === '/student/performance') return 'Academic Performance';
    if (path === '/student/profile') return 'Student Profile';
    if (path === '/admin/dashboard') return 'System Overview';
    if (path === '/admin/users') return 'User Management';
    if (path === '/admin/courses') return 'Institute Courses';
    return 'Teacher Dashboard';
  };

  const handleRoleSelect = (role: Role) => {
    switchRole(role);
    setShowRoleMenu(false);
  };

  const displayedNotifications = notifTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'evaluation':
        return <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'integrity':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'deadline':
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-academic-darkCard border-b border-academic-lightBorder dark:border-academic-darkBorder px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150">
      {/* Left side: Page Title & Optional Quick Search */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-academic-lightText dark:text-academic-darkText tracking-tight">
          {getPageTitle()}
        </h1>

        <div className="hidden md:flex items-center relative ml-4">
          <Search className="w-4 h-4 absolute left-3 text-academic-lightMuted dark:text-academic-darkMuted" />
          <input
            type="text"
            placeholder="Search assignments, students..."
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-md text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-academic-primary w-64 transition-all"
          />
        </div>
      </div>

      {/* Right side: Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prominent Copilot Button (Teacher Only) */}
        {currentUser.role === 'teacher' && (
          <button
            onClick={openCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
            title="GradeFlow AI Copilot (⌘K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Copilot</span>
            <kbd className="hidden md:inline-block text-[10px] font-mono px-1 py-0.2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded text-slate-500 dark:text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-academic-lightMuted dark:text-academic-darkMuted hover:text-academic-lightText dark:hover:text-academic-darkText hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-academic-lightMuted dark:text-academic-darkMuted hover:text-academic-lightText dark:hover:text-academic-darkText hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-xl py-2 z-50">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-academic-lightBorder dark:border-academic-darkBorder flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                      {unreadNotificationsCount} unread
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-academic-lightBorder dark:border-academic-darkBorder px-3 pt-1 text-[11px] gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`pb-1.5 px-2 font-medium border-b-2 transition-colors ${
                    notifTab === 'all'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('unread')}
                  className={`pb-1.5 px-2 font-medium border-b-2 transition-colors ${
                    notifTab === 'unread'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Unread ({unreadNotificationsCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {displayedNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No {notifTab === 'unread' ? 'unread' : ''} notifications.
                  </div>
                ) : (
                  displayedNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        !n.read ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                          {n.actionText && n.link && (
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  markNotificationAsRead(n.id);
                                  setShowNotifications(false);
                                  navigate(n.link);
                                }}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {n.actionText} →
                              </button>
                              {!n.read && (
                                <button
                                  onClick={() => markNotificationAsRead(n.id)}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              {currentUser.role === 'teacher' && (
                <div className="px-3 py-2 border-t border-academic-lightBorder dark:border-academic-darkBorder bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Need pending items?</span>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/teacher/inbox');
                    }}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Inbox className="w-3 h-3" />
                    <span>Evaluation Inbox</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-950 text-academic-primary flex items-center justify-center font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
              {currentUser.role === 'teacher' ? 'T' : currentUser.role === 'student' ? 'S' : 'A'}
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <div className="font-semibold text-academic-lightText dark:text-academic-darkText">
                {currentUser.name}
              </div>
              <div className="text-academic-lightMuted dark:text-academic-darkMuted capitalize text-[10px]">
                {currentUser.role} View
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-academic-lightMuted dark:text-academic-darkMuted" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                <p className="text-[11px] text-academic-lightMuted dark:text-academic-darkMuted truncate">{currentUser.email}</p>
              </div>

              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-academic-lightMuted dark:text-academic-darkMuted">
                Switch Role View
              </div>

              <button
                onClick={() => handleRoleSelect('teacher')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  currentUser.role === 'teacher' ? 'font-semibold text-academic-primary' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Teacher (Prof. Sarah Jenkins)</span>
              </button>

              <button
                onClick={() => handleRoleSelect('student')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  currentUser.role === 'student' ? 'font-semibold text-academic-primary' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Student (Rahul Kumar)</span>
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  currentUser.role === 'admin' ? 'font-semibold text-academic-primary' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Admin (Dr. Arvind Mehta)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
