'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { fadeUp } from '@/lib/motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type JoinState = 'loading' | 'ready' | 'error' | 'expired' | 'full';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { role, setCustomerAuth } = useAuthStore();
  const { addToast } = useToast();

  const [state, setState] = useState<JoinState>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const resolvedRef = useRef(false);

  // Resolve token → sessionId on mount
  useEffect(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    // Redirect if already authenticated as agent
    if (role === 'AGENT') {
      router.replace('/dashboard');
      return;
    }

    const resolveToken = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sessions/by-token/${token}`);
        setSessionId(res.data.sessionId);
        setState('ready');
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 404) {
          setState('error');
          setErrorMsg('This invite link is invalid or has expired.');
        } else if (status === 403) {
          setState('expired');
        } else {
          setState('error');
          setErrorMsg('Unable to validate invite link. Please try again.');
        }
      }
    };

    resolveToken();
  }, [token, router, role]);

  const handleJoin = async () => {
    if (!sessionId) return;
    setIsJoining(true);

    try {
      // Pass the invite token (URL param) to the join endpoint
      const res = await axios.post(`${API_BASE}/api/sessions/${sessionId}/join`, {
        inviteToken: token,
      });

      const { token: jwt, sessionId: sid, participantId } = res.data;
      setCustomerAuth(jwt, sid, participantId);
      addToast('Joined session!', 'success');
      router.push(`/room/${sid}`);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to join';

      if (status === 403) {
        setState('expired');
      } else if (status === 409) {
        setState('full');
      } else {
        setErrorMsg(msg);
        setState('error');
      }
      addToast(msg, 'error');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="min-h-screen flex items-center justify-center bg-bg-base px-4"
    >
      {state === 'loading' && (
        <Glass className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-sm">Validating invite link...</p>
        </Glass>
      )}

      {state === 'ready' && (
        <Glass className="w-full max-w-md p-8 space-y-6 text-center">
          <div className="space-y-3">
            {/* Brand */}
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              AtomQuest Support
            </h1>
            <p className="text-4xl font-bold tracking-tight text-text-primary leading-tight">
              You&apos;ve been invited to a support session
            </p>
            <p className="text-sm text-text-secondary">
              Click the button below to join the video call.
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full py-3 text-base"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              'Join Call'
            )}
          </Button>

          <p className="text-xs text-text-tertiary">
            By joining, you agree to be recorded for support purposes.
          </p>
        </Glass>
      )}

      {state === 'error' && (
        <Glass className="w-full max-w-md p-8 space-y-4 text-center">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-xl font-semibold text-text-primary">Invalid Link</h2>
          <p className="text-sm text-text-secondary">{errorMsg || 'This invite link is invalid or has expired.'}</p>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </Glass>
      )}

      {state === 'expired' && (
        <Glass className="w-full max-w-md p-8 space-y-4 text-center">
          <p className="text-4xl">⌛</p>
          <h2 className="text-xl font-semibold text-text-primary">Session Ended</h2>
          <p className="text-sm text-text-secondary">
            This invite link is no longer valid. The session has ended.
          </p>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </Glass>
      )}

      {state === 'full' && (
        <Glass className="w-full max-w-md p-8 space-y-4 text-center">
          <p className="text-4xl">👥</p>
          <h2 className="text-xl font-semibold text-text-primary">Session is Full</h2>
          <p className="text-sm text-text-secondary">
            Another participant is already in this session. Please contact the support agent.
          </p>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Go Home
          </Button>
        </Glass>
      )}
    </motion.div>
  );
}