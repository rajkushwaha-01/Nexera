import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  const variantStyles = {
    primary:
      'bg-ink-primary text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-400 border border-transparent shadow-ambient',
    secondary:
      'bg-white text-ink-primary border border-line hover:bg-canvas-subtle hover:border-line-strong active:bg-slate-100 focus:ring-slate-300 shadow-ambient',
    ghost:
      'bg-transparent text-ink-secondary hover:bg-canvas-subtle hover:text-ink-primary active:bg-slate-100 focus:ring-slate-200 border border-transparent',
    danger:
      'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:bg-rose-200 focus:ring-rose-300',
    subtle:
      'bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 active:bg-brand-200 focus:ring-brand-300',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

export default Button;
