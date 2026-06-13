'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-bg-float/70 backdrop-blur-glass border border-bg-border/60',
          'shadow-float rounded-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Glass.displayName = 'Glass';

export { Glass };