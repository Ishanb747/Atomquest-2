'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore, getAuthHeaders } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useToast } from '@/components/ui/Toast';
import { PageTransition } from '@/components/layout/PageTransition';
import { fadeUp, staggerContainer } from '@/lib/motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SessionSummary {
  id: string;
  agentId: string;
  status: 'ACTIVE' | 'ENDED';
  inviteToken: string;
  createdAt: string;
  endedAt: string | null;
  participants: { id: string; role: string; joinedAt: string; leftAt: string | null }[];
  _count: { messages: number };
}

function DashboardContent() {
  const { logout } = useAuthStore();
  const { createSession, isLoading, inviteUrl } = useSessionStore();
  const { addToast } = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Load past sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sessions`, { headers: getAuthHeaders() });
        setSessions(res.data);
      } catch (err) {
        console.warn('Failed to load sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleNewSession = async () => {
    try {
      const { sessionId } = await createSession();
      addToast('Session created!', 'success');
      router.push(`/session/${sessionId}`);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const copyInviteLink = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        addToast('Invite link copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        addToast('Failed to copy', 'error');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getDuration = (session: SessionSummary) => {
    const end = session.endedAt ? new Date(session.endedAt) : new Date();
    const start = new Date(session.createdAt);
    const secs = Math.floor((end.getTime() - start.getTime()) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <header className="border-b border-bg-border bg-bg-raised">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-text-primary">AtomQuest</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">Agent</span>
              <Button variant="ghost" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
              Dashboard
            </h2>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push('/admin')}>
                Admin Panel
              </Button>
              <Button variant="primary" onClick={handleNewSession} disabled={isLoading}>
                {isLoading ? 'Creating...' : '+ New Session'}
              </Button>
            </div>
          </div>

          {/* Invite link (shown after creation) */}
          {inviteUrl && (
            <motion.div variants={fadeUp} initial="initial" animate="animate">
              <Glass className="p-4 space-y-3 border-l-4 border-accent">
                <p className="text-sm font-medium text-text-primary">Session ready — invite your customer:</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 font-mono text-xs bg-bg-overlay px-3 py-2 rounded-sm text-accent break-all">
                    {inviteUrl}
                  </code>
                  <Button variant="ghost" onClick={copyInviteLink}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </Button>
                </div>
              </Glass>
            </motion.div>
          )}

          {/* Sessions list */}
          <div>
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide mb-4">
              Recent Sessions
            </h3>

            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-bg-overlay animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <motion.div variants={fadeUp} className="w-16 h-16 rounded-full bg-bg-overlay flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </motion.div>
                <motion.p variants={fadeUp} className="text-text-secondary text-sm">
                  No sessions yet. Click &quot;New Session&quot; to start a support call.
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-3"
              >
                {sessions.map((session) => (
                  <motion.div key={session.id} variants={fadeUp}>
                    <Glass className="p-4 flex items-center gap-4 hover:bg-bg-float/80 transition-colors cursor-pointer"
                      onClick={() => session.status === 'ACTIVE' && router.push(`/session/${session.id}`)}>
                      {/* Status badge */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        session.status === 'ACTIVE' ? 'bg-success animate-pulse' : 'bg-text-tertiary'
                      }`} />

                      {/* Session info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary font-mono truncate">
                            {session.id.slice(0, 8)}…
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${
                            session.status === 'ACTIVE'
                              ? 'bg-success/10 text-success'
                              : 'bg-bg-overlay text-text-tertiary'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-text-tertiary">{formatDate(session.createdAt)}</span>
                          <span className="text-xs text-text-tertiary">·</span>
                          <span className="text-xs text-text-tertiary">{getDuration(session)}</span>
                          <span className="text-xs text-text-tertiary">·</span>
                          <span className="text-xs text-text-tertiary">{session._count.messages} msgs</span>
                        </div>
                      </div>

                      {/* Participant count */}
                      <div className="text-xs text-text-tertiary flex items-center gap-1 flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {session.participants.length}
                      </div>

                      {/* Action */}
                      {session.status === 'ACTIVE' && (
                        <Button variant="primary" className="text-xs px-3 py-1.5 flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); router.push(`/session/${session.id}`); }}>
                          Rejoin
                        </Button>
                      )}
                    </Glass>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="AGENT">
      <DashboardContent />
    </ProtectedRoute>
  );
}