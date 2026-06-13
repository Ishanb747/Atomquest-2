'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-base overflow-hidden selection:bg-accent/30 selection:text-text-primary">

      {/* Ambient glow — single source of truth, restrained */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-accent/10 blur-[140px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5 group"
          aria-label="AtomQuest home"
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow transition-shadow duration-200 group-hover:shadow-[0_0_24px_rgba(10,132,255,0.5)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z" />
              <path d="M12 2A15.3 15.3 0 0 1 22 12A15.3 15.3 0 0 1 12 22A15.3 15.3 0 0 1 2 12A15.3 15.3 0 0 1 12 2Z" />
              <path d="M2 12H22" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-text-primary">AtomQuest</span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/dev')}
            className={pathname === '/dev' ? 'border-accent/40 text-accent' : ''}
          >
            Components
          </Button>
          <Button variant="primary" onClick={() => router.push('/login')}>
            Agent Login
          </Button>
        </div>
      </nav>

      {/* Page content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-bg-border/40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            AtomQuest &copy; 2026
          </p>
          <p className="text-xs text-text-tertiary">
            Enterprise WebRTC Platform
          </p>
        </div>
      </footer>
    </div>
  );
}