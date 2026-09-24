import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, Check } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  // Default credentials set to admin / admin123 as requested
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success && result.user) {
        // Direct to the appropriate portal based on authenticated user role
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'student') {
          navigate('/student/dashboard');
        } else if (result.user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setErrorMessage(
          result.error ||
          'Invalid username or password. Note: Teacher and Student accounts must be created by the Administrator.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-lg flex items-center justify-center shadow-sm">
            G
          </div>
          <span className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white">
            GradeFlow
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sign In to Your Account
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Academic Evaluation &amp; Plagiarism Detection Management
        </p>
      </div>

      {/* Main Login Card - Clean solid borders and solid background, zero gradients */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 shadow-sm">
          
          {/* Admin Credentials Callout Box */}
          <div className="mb-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Administrator Credentials
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillAdmin}
                className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white underline underline-offset-2 transition-colors"
              >
                Autofill Admin
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-zinc-800 dark:text-zinc-200">
              <div>
                <span className="text-[10px] uppercase font-sans text-zinc-400 block">Username</span>
                <span className="font-bold">admin</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-sans text-zinc-400 block">Password</span>
                <span className="font-bold">admin123</span>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Teacher and Student accounts are created and provisioned by the Administrator in the Admin User Management portal.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  placeholder="e.g. admin or created username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 text-sm bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                />
                <span>Keep me signed in</span>
              </label>

              <span className="text-zinc-400 text-[11px]">
                Role-based routing enabled
              </span>
            </div>

            {/* Solid Submit Button (No gradients) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Information */}
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Need account access? Contact the department <strong className="text-zinc-800 dark:text-zinc-200">System Administrator</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
