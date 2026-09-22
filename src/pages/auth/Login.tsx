import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, User as UserIcon, ArrowRight, UserCheck, GraduationCap, ShieldCheck, AlertCircle } from 'lucide-react';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('teacher');
  const [password, setPassword] = useState('teacher123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        const clean = username.trim().toLowerCase();
        if (clean === 'student' || clean.includes('student')) {
          navigate('/student/dashboard');
        } else if (clean === 'admin' || clean.includes('admin')) {
          navigate('/admin/dashboard');
        } else {
          navigate('/teacher/dashboard');
        }
      } else {
        setErrorMessage('Invalid username or password. Please verify your academic credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: Role, demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const success = await login(demoUser, demoPass, role);
      if (success) {
        if (role === 'student') navigate('/student/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/teacher/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            G
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Grade<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Intelligent Assignment Evaluation Platform
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
          Sign in to access your courses, manage rubric evaluations, and analyze student academic outcomes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Username or Institutional Email
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-700 rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="e.g. teacher, student, admin"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 text-sm bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-700 rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to GradeFlow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Picker with Exact Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-center mb-3">
              One-Click Quick Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('teacher', 'teacher', 'teacher123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors text-center"
              >
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Teacher</span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">teacher</span>
                <span className="text-[8px] font-mono text-slate-400 dark:text-zinc-500">teacher123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student', 'student', 'student123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors text-center"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Student</span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">student</span>
                <span className="text-[8px] font-mono text-slate-400 dark:text-zinc-500">student123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin', 'admin123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors text-center"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Admin</span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">admin</span>
                <span className="text-[8px] font-mono text-slate-400 dark:text-zinc-500">admin123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
