'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CallRoom } from '@/components/video/CallRoom';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { scaleIn } from '@/lib/motion';
import axios from 'axios';
import { getAuthHeaders } from '@/stores/authStore';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

function CustomerCallRoomContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const headers = getAuthHeaders();
        // Fetch LiveKit token
        const tokenRes = await axios.get(`${API_BASE}/api/sessions/${id}/token`, { headers });
        setLivekitToken(tokenRes.data.livekitToken);
      } catch (err) {
        addToast('Failed to connect to room', 'error');
      }
    };
    fetchToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLeave = useCallback(() => {
    addToast('You left the call', 'info');
    router.push('/');
  }, [addToast, router]);

  const handleNewChatMessage = useCallback(() => {
    if (!isChatOpen) setHasUnreadChat(true);
  }, [isChatOpen]);

  // Session ended screen
  if (sessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
        <motion.div variants={scaleIn} initial="initial" animate="animate">
          <Glass className="w-full max-w-sm p-8 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-bg-overlay flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                <path d="M22.7 8.7a15.7 15.7 0 0 0-21.4 0c-.7.7-.7 1.8 0 2.5l2 2c.6.6 1.5.6 2.1 0a4.7 4.7 0 0 1 6.2-.3c.3.3.7.4 1 .4s.7-.1 1-.4a4.7 4.7 0 0 1 6.2.3c.6.6 1.5.6 2.1 0l2-2c.7-.7.7-1.8 0-2.5z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Call Ended</h2>
            <p className="text-sm text-text-secondary">
              The support agent has ended this session. Thank you for connecting.
            </p>
            <Button variant="ghost" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </Glass>
        </motion.div>
      </div>
    );
  }

  if (!livekitToken || !LIVEKIT_URL) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={livekitToken}
      serverUrl={LIVEKIT_URL}
      connect={true}
      onDisconnected={() => setSessionEnded(true)}
    >
      <CallRoom
        isChatOpen={isChatOpen}
        hasUnreadChat={hasUnreadChat}
        showEndCall={false}
        showLeave
        remoteName="Agent"
        remoteInitials="A"
        localName="You"
        localInitials="C"
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setHasUnreadChat(false);
        }}
        onEndCall={handleLeave}
        chatPanel={
          <ChatPanel
            sessionId={id}
            onNewMessage={handleNewChatMessage}
          />
        }
      />
    </LiveKitRoom>
  );
}

export default function CustomerCallRoomPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <CustomerCallRoomContent />
    </ProtectedRoute>
  );
}