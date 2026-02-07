import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const Badge = ({ children, className = '', variant = 'default', ...props }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-glass2 text-text border border-stroke',
    success: 'bg-[var(--risk-low)] text-[var(--risk-low-solid)] border border-[var(--risk-low-solid)] border-opacity-20',
    warning: 'bg-[var(--risk-med)] text-[var(--risk-med-solid)] border border-[var(--risk-med-solid)] border-opacity-20',
    danger: 'bg-[var(--risk-high)] text-[var(--risk-high-solid)] border border-[var(--risk-high-solid)] border-opacity-20',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};