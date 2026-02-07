import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton = ({ className = '', variant = 'rectangular', ...props }: SkeletonProps) => {
  const baseClasses = 'skeleton';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'w-full h-full rounded-2xl',
    circular: 'rounded-full',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return <div className={classes} {...props} />;
};