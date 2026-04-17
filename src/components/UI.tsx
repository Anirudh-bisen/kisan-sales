import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-olive text-white hover:opacity-90 shadow-sm border border-olive',
      secondary: 'bg-olive-light text-paper hover:opacity-90 border border-olive-light',
      outline: 'border border-editorial-border text-olive hover:bg-bg',
      ghost: 'text-olive hover:bg-bg',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest',
      md: 'px-5 py-2.5 text-xs uppercase font-bold tracking-wider',
      lg: 'px-8 py-4 text-sm uppercase font-black tracking-[0.2em]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-[2px] font-sans transition-all focus:outline-none focus:ring-1 focus:ring-olive disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-paper border border-editorial-border rounded p-4 shadow-sm', className)} {...props}>
    {children}
  </div>
);

export const Badge = ({ className, variant = 'default', children }: { className?: string, variant?: 'default' | 'success' | 'warning' | 'error' | 'info', children: React.ReactNode }) => {
  const variants = {
    default: 'bg-bg text-olive border border-editorial-border',
    success: 'bg-olive text-white',
    warning: 'bg-[#F27D26] text-white',
    error: 'bg-red-700 text-white',
    info: 'bg-olive-light text-paper',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};
