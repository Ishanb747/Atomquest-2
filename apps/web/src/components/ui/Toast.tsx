'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { toastVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type Severity = 'info' | 'success' | 'warning' | 'error';

interface ToastData {
  id: string;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  addToast: (message: string, severity?: Severity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const severityStyles: Record<Severity, string> = {
  info:    'border-l-4 border-accent',
  success: 'border-l-4 border-success',
  warning: 'border-l-4 border-warning',
  error:   'border-l-4 border-danger',
};

const severityDots: Record<Severity, string> = {
  info:    'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error:   'bg-danger',
};

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative overflow-hidden',
        'bg-bg-float/70 backdrop-blur-glass border border-bg-border/60',
        'shadow-float rounded-xl px-4 py-3 min-w-[280px] max-w-[400px]',
        severityStyles[toast.severity]
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('w-2 h-2 rounded-full shrink-0', severityDots[toast.severity])} />
        <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      </div>
      {/* Countdown progress line */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 h-0.5',
          severityDots[toast.severity].replace('bg-', 'bg-')
        )}
        style={{ width: `${progress}%` }}
      />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, severity: Severity = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, severity }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-4 flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}