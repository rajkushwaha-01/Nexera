import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    default: 'bg-slate-50 text-slate-700 border-slate-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    planning: 'bg-slate-50 text-slate-600 border-slate-200',
    atRisk: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    onHold: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const dotColors = {
    default: 'bg-slate-400',
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-emerald-500',
    active: 'bg-emerald-500',
    planning: 'bg-slate-400',
    atRisk: 'bg-rose-500',
    completed: 'bg-indigo-500',
    onHold: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
