'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';

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
    <main className="min-h-screen bg-bg-base overflow-hidden selection:bg-accent/30 selection:text-text-primary">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z" />
              <path d="M12 2A15.3 15.3 0 0 1 22 12A15.3 15.3 0 0 1 12 22A15.3 15.3 0 0 1 2 12A15.3 15.3 0 0 1 12 2Z" />
              <path d="M2 12H22" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-text-primary">AtomQuest</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dev')}>
            Design Preview
          </Button>
          <Button variant="primary" onClick={() => router.push('/login')}>
            Agent Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-3xl space-y-8"
        >
          <motion.div variants={fadeUp} className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-text-secondary">
              Real-time video support, reimagined.
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Connect with your customers instantly. Enterprise-grade WebRTC powered by mediasoup, wrapped in an Apple-grade UI.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Join Session Form */}
            <form onSubmit={handleJoin} className="relative w-full sm:w-auto flex items-center">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste invite code..."
                className="w-full sm:w-[300px] bg-bg-overlay/50 backdrop-blur-glass border border-bg-border rounded-full pl-6 pr-24 py-4 text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/50 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inviteCode.trim()}
                className="absolute right-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </form>
          </motion.div>
        </motion.div>

        {/* Hero Image/Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-5xl px-4"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-bg-border/60 shadow-2xl bg-bg-raised">
            {/* Fake Video Call UI */}
            <div className="absolute inset-0 bg-video-bg">
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-24 h-24 rounded-full bg-bg-float flex items-center justify-center border border-bg-border">
                   <span className="text-3xl text-text-secondary font-semibold">C</span>
                 </div>
              </div>
              <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-sm font-medium text-white">Customer</span>
              </div>
              <div className="absolute bottom-6 right-6 w-48 aspect-video bg-bg-float rounded-xl border border-white/10 overflow-hidden shadow-lg flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center">
                   <span className="text-lg text-text-secondary font-semibold">A</span>
                 </div>
              </div>
              
              {/* Fake Toolbar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-bg-float/80 backdrop-blur-glass rounded-2xl border border-bg-border">
                 <div className="w-10 h-10 rounded-xl bg-bg-overlay flex items-center justify-center text-text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-bg-overlay flex items-center justify-center text-text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
                 </div>
                 <div className="w-px h-6 bg-bg-border mx-1" />
                 <div className="px-4 py-2 rounded-xl bg-danger/10 text-danger font-medium text-sm">
                    End Call
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-bg-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Glass className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Ultra-Low Latency</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Powered by mediasoup SFU for robust, low-latency video routing without the overhead of P2P mesh networks.
            </p>
          </Glass>
          <Glass className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Secure by Design</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              JWT authentication, strict role enforcement, and short-lived invite tokens keep your sessions private.
            </p>
          </Glass>
          <Glass className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Seamless Workflows</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              In-call chat, file sharing, recording to MinIO, and a comprehensive admin dashboard out of the box.
            </p>
          </Glass>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center border-t border-bg-border/50">
        <p className="text-xs text-text-tertiary">
          AtomQuest Platform &copy; 2026. All rights reserved.
        </p>
      </footer>
    </main>
  );
}