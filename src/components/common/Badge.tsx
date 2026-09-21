import React from 'react';

type BadgeVariant = 
  | 'green'   // Completed / Evaluated / Submitted / Active
  | 'amber'   // Pending / Warning
  | 'rose'    // Late / Flagged / Inactive
  | 'blue'    // Active / Info
  | 'purple'  // AI-related
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  children, 
  className = '',
  size = 'md'
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-md tracking-tight transition-colors";
  
  const sizeStyles = size === 'sm' 
    ? "px-2 py-0.5 text-xs gap-1" 
    : "px-2.5 py-1 text-xs gap-1.5";

  // Strict NO GRADIENTS: clean solid tones with matching borders and contrast
  const variantStyles: Record<BadgeVariant, string> = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    amber: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    rose: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    blue: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    purple: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
  };

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
