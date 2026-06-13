'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { VideoTile } from '@/components/video/VideoTile';
import { CallToolbar } from '@/components/video/CallToolbar';
import { PageShell } from '@/components/layout/PageShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { ToastProvider, useToast } from '@/components/ui/Toast';

// ── Nav sections ─────────────────────────────────────────────
const SECTIONS = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'surfaces',    label: 'Surfaces'    },
  { id: 'controls',   label: 'Controls'    },
  { id: 'media',      label: 'Media'       },
  { id: 'feedback',   label: 'Feedback'    },
];

// ── Section wrapper ──────────────────────────────────────────
function Section({
  id,
  label,
  description,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section id={id} variants={fadeUp} className="space-y-5 scroll-mt-20">
      <div className="space-y-0.5 pb-3 border-b border-bg-border/40">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">{label}</h2>
        {description && (
          <p className="text-xs text-text-tertiary leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// ── Status badge ─────────────────────────────────────────────
function Badge({
  label,
  variant = 'default',
  dot = false,
}: {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
}) {
  const styles = {
    default: { wrap: 'bg-bg-overlay border-bg-border text-text-secondary', dot: 'bg-text-tertiary' },
    success: { wrap: 'bg-success/10 border-success/30 text-success',         dot: 'bg-success' },
    warning: { wrap: 'bg-warning/10 border-warning/30 text-warning',         dot: 'bg-warning' },
    danger:  { wrap: 'bg-danger/10  border-danger/30  text-danger',           dot: 'bg-danger'  },
    info:    { wrap: 'bg-info/10    border-info/30    text-info',             dot: 'bg-info'    },
  };
  const s = styles[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${s.wrap}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {label}
    </span>
  );
}

// ── Typography row ───────────────────────────────────────────
function TypeRow({ label, size, children }: { label: string; size: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-bg-border/25 last:border-0">
      <div className="w-24 shrink-0 space-y-0.5">
        <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-wider">{label}</span>
        <span className="block text-[10px] text-text-tertiary/60">{size}</span>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// ── Color swatch ─────────────────────────────────────────────
function Swatch({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg border border-white/10 ${color} shrink-0`} />
      <div>
        <p className="text-xs font-medium text-text-primary">{label}</p>
        <p className="text-[10px] text-text-tertiary font-mono">{value}</p>
      </div>
    </div>
  );
}

// ── Dev page content ─────────────────────────────────────────
function DevContent() {
  const { addToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <PageShell>
      <PageTransition>
        {/* ── Compact branded intro ────────────────────────── */}
        <section className="flex flex-col items-center justify-center pt-10 pb-8 px-6 text-center border-b border-bg-border/30">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-xl space-y-3"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium tracking-wide uppercase">
                Design System
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-text-secondary"
            >
              Components
            </motion.h1>
            <motion.p variants={fadeUp} className="text-sm text-text-tertiary">
              The building blocks of AtomQuest.
            </motion.p>
          </motion.div>
        </section>

        {/* ── Two-column layout: sidebar nav + content ─────── */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex gap-10">

            {/* Sticky sidebar */}
            <aside className="hidden lg:block w-44 shrink-0">
              <div className="sticky top-6 space-y-1">
                <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-3 px-2">On this page</p>
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-colors duration-150"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="flex-1 min-w-0 space-y-14"
            >

              {/* ── Foundations ─────────────────────────────── */}
              <Section
                id="foundations"
                label="Foundations"
                description="Type scale, color tokens, and spacing — the primitives everything else is built on."
              >
                {/* Typography */}
                <Glass className="p-5 divide-y divide-bg-border/25">
                  <TypeRow label="Hero" size="text-5xl–7xl / bold">
                    <span className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-text-secondary whitespace-nowrap">
                      Real-time video.
                    </span>
                  </TypeRow>
                  <TypeRow label="Heading" size="text-2xl / semibold">
                    <span className="text-xl font-semibold tracking-tight text-text-primary">
                      Ultra-Low Latency
                    </span>
                  </TypeRow>
                  <TypeRow label="Body" size="text-sm / regular">
                    <span className="text-sm text-text-secondary leading-relaxed">
                      Connect with your customers instantly across any device, at any scale.
                    </span>
                  </TypeRow>
                  <TypeRow label="Metadata" size="text-xs / regular">
                    <span className="text-xs text-text-tertiary">
                      AtomQuest &copy; 2026 &middot; Enterprise WebRTC Platform
                    </span>
                  </TypeRow>
                </Glass>

                {/* Color palette */}
                <Glass className="p-5">
                  <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider mb-4">Color tokens</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Swatch color="bg-accent"   label="Accent"  value="#0A84FF" />
                    <Swatch color="bg-success"  label="Success" value="#30D158" />
                    <Swatch color="bg-warning"  label="Warning" value="#FFD60A" />
                    <Swatch color="bg-danger"   label="Danger"  value="#FF453A" />
                  </div>
                </Glass>
              </Section>

              {/* ── Surfaces ────────────────────────────────── */}
              <Section
                id="surfaces"
                label="Surfaces"
                description="Glass cards used for panels, modals, and feature highlights."
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Glass className="p-5 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">Default</p>
                      <p className="text-xs text-text-secondary leading-relaxed">Backdrop blur, semi-transparent fill, restrained border.</p>
                    </div>
                  </Glass>

                  <Glass className="p-5 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center text-success">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">With status</p>
                      <p className="text-xs text-text-secondary leading-relaxed">Semantic accent icons signal state without color overload.</p>
                    </div>
                  </Glass>

                  <Glass className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-text-primary">With metadata</p>
                      <Badge label="Live" variant="success" dot />
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">Heading, body, and a muted status line coexist cleanly.</p>
                    <p className="text-[10px] text-text-tertiary">Updated 2 min ago</p>
                  </Glass>
                </div>
              </Section>

              {/* ── Controls ────────────────────────────────── */}
              <Section
                id="controls"
                label="Controls"
                description="Button variants, states, and semantic status indicators."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buttons */}
                  <Glass className="p-5 space-y-3">
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Buttons</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary">Primary</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                      <Button variant="icon" aria-label="Mic">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="22"/>
                        </svg>
                      </Button>
                      <Button variant="primary" disabled>Disabled</Button>
                    </div>
                  </Glass>

                  {/* Badges */}
                  <Glass className="p-5 space-y-3">
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Status badges</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge label="Connected"    variant="success" dot />
                      <Badge label="Reconnecting" variant="warning" dot />
                      <Badge label="Call ended"   variant="danger"  dot />
                      <Badge label="Info"         variant="info"    dot />
                      <Badge label="Idle"         variant="default" dot />
                    </div>
                  </Glass>
                </div>
              </Section>

              {/* ── Media ───────────────────────────────────── */}
              <Section
                id="media"
                label="Media"
                description="Video tiles and call controls used in live sessions."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VideoTile name="Agent"    initials="AG" isMuted={false} isActive />
                    <VideoTile name="Customer" initials="CU" isMuted isActive={false} />
                  </div>

                  <Glass className="p-5 space-y-2">
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Call Toolbar</p>
                    <div className="relative h-16">
                      <CallToolbar
                        isMicOn={true}
                        isCameraOn={true}
                        isChatOpen={false}
                        hasUnreadChat={false}
                        showEndCall={true}
                        onToggleMic={() => {}}
                        onToggleCamera={() => {}}
                        onToggleChat={() => {}}
                        onEndCall={() => {}}
                      />
                    </div>
                  </Glass>
                </div>
              </Section>

              {/* ── Feedback ────────────────────────────────── */}
              <Section
                id="feedback"
                label="Feedback"
                description="Toast notifications for system events."
              >
                <Glass className="p-5 space-y-4">
                  <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Trigger toasts</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost"  onClick={() => addToast('Session started successfully.',  'success')}>Success</Button>
                    <Button variant="ghost"  onClick={() => addToast('Reconnecting to the session…',  'warning')}>Warning</Button>
                    <Button variant="ghost"  onClick={() => addToast('New message from Customer.',     'info')}>Info</Button>
                    <Button variant="danger" onClick={() => addToast('Connection lost. Please retry.','error')}>Error</Button>
                  </div>
                </Glass>
              </Section>

            </motion.div>
          </div>
        </div>
      </PageTransition>
    </PageShell>
  );
}

export default function DevPage() {
  return (
    <ToastProvider>
      <DevContent />
    </ToastProvider>
  );
}