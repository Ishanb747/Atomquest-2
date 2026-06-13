'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageTransition } from '@/components/layout/PageTransition';

// ── Subtle animated background layer ─────────────────────────
function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Primary slow-drift glow orb */}
      <motion.div
        className="absolute top-[-15%] left-[45%] w-[600px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.12) 0%, transparent 70%)' }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary warm accent orb — barely visible */}
      <motion.div
        className="absolute bottom-[10%] right-[15%] w-[400px] h-[320px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.06) 0%, transparent 70%)' }}
        animate={{ x: [0, -25, 15, 0], y: [0, 15, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
        }}
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteCode.trim();
    if (!trimmed) return;

    let token = trimmed;
    if (trimmed.includes('/join/')) {
      token = trimmed.split('/join/')[1]?.split(/[?#]/)[0] || trimmed;
    }

    router.push(`/join/${token}`);
  };

  return (
    <PageShell>
      <AmbientBackground />
      <PageTransition>
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-3xl space-y-8"
          >
            {/* Heading + subtitle */}
            <motion.div variants={fadeUp} className="space-y-5">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-text-secondary">
                Real-time video support, reimagined.
              </h1>
              <p className="text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
                Connect with your customers instantly. Enterprise-grade WebRTC
                powered by mediasoup, wrapped in an Apple-grade UI.
              </p>
            </motion.div>

            {/* CTA row */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <form
                onSubmit={handleJoin}
                className="relative w-full sm:w-auto flex items-center"
              >
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste invite code…"
                  className="w-full sm:w-[300px] h-11 bg-bg-overlay/60 backdrop-blur-glass border border-bg-border/60 rounded-xl pl-5 pr-24 text-sm text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/50 focus:border-transparent focus:outline-none transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!inviteCode.trim()}
                  className="absolute right-1.5 px-4 h-8 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </form>

              <Button variant="ghost" onClick={() => router.push('/login')}>
                Agent Login
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero mockup — gentle float */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="mt-20 w-full max-w-5xl px-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Glow bloom under the mockup */}
              <div
                className="absolute -inset-x-8 -bottom-8 h-24 opacity-40 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(10,132,255,0.18), transparent)' }}
              />

              <div className="relative aspect-video rounded-2xl overflow-hidden border border-bg-border/50 shadow-float bg-bg-raised">
                {/* Video background */}
                <div className="absolute inset-0 bg-video-bg">
                  {/* Remote participant */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-bg-float flex items-center justify-center border border-bg-border">
                      <span className="text-3xl text-text-secondary font-semibold">C</span>
                    </div>
                  </div>
                  <div className="absolute bottom-5 left-5 px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                    <span className="text-xs font-medium text-white">Customer</span>
                  </div>

                  {/* Self-view PIP */}
                  <div className="absolute bottom-5 right-5 w-44 aspect-video bg-bg-float rounded-xl border border-white/10 shadow-float overflow-hidden flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-bg-base flex items-center justify-center">
                      <span className="text-base text-text-secondary font-semibold">A</span>
                    </div>
                  </div>

                  {/* Call toolbar */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 bg-bg-float/80 backdrop-blur-glass rounded-2xl border border-bg-border/50">
                    <div className="w-9 h-9 rounded-xl bg-bg-overlay flex items-center justify-center text-text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="22"/>
                      </svg>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-bg-overlay flex items-center justify-center text-text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m22 8-6 4 6 4V8Z"/>
                        <rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>
                      </svg>
                    </div>
                    <div className="w-px h-5 bg-bg-border mx-0.5" />
                    <div className="px-3.5 py-1.5 rounded-xl bg-danger/10 border border-danger/20 text-danger font-medium text-xs">
                      End Call
                    </div>
                  </div>

                  {/* Animated "live" indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-danger"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-[10px] font-medium text-white tracking-wide uppercase">Live</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section className="py-24 px-6 max-w-7xl mx-auto border-t border-bg-border/40">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={fadeUp}>
              <Glass className="p-8 space-y-4 h-full hover:border-bg-border/80 transition-colors duration-300">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary">Ultra-Low Latency</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Powered by mediasoup SFU for robust, low-latency video routing without P2P mesh overhead.
                  </p>
                </div>
              </Glass>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Glass className="p-8 space-y-4 h-full hover:border-bg-border/80 transition-colors duration-300">
                <div className="w-11 h-11 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary">Secure by Design</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    JWT authentication, strict role enforcement, and short-lived invite tokens keep sessions private.
                  </p>
                </div>
              </Glass>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Glass className="p-8 space-y-4 h-full hover:border-bg-border/80 transition-colors duration-300">
                <div className="w-11 h-11 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary">Seamless Workflows</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    In-call chat, file sharing, recording, and a comprehensive admin dashboard, out of the box.
                  </p>
                </div>
              </Glass>
            </motion.div>
          </motion.div>
        </section>
      </PageTransition>
    </PageShell>
  );
}