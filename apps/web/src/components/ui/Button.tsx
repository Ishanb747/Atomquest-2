'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const buttonVariants = {
  primary:
    'bg-accent hover:bg-accent-hover text-text-inverse shadow-glow hover:shadow-[0_0_28px_rgba(10,132,255,0.4)]',
  ghost:
    'bg-transparent border border-bg-border text-text-primary hover:bg-bg-overlay hover:border-bg-border/80',
  danger:
    'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
  icon: 'bg-bg-overlay border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-float',
};

type Variant = keyof typeof buttonVariants;

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5',
          'rounded-xl text-sm font-medium cursor-pointer',
          'transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none',
          disabled && 'opacity-40 cursor-not-allowed',
          variant === 'icon' && 'p-2.5',
          buttonVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type Variant as ButtonVariant };