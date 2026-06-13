'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CallRoom } from '@/components/video/CallRoom';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { useSessionStore } from '@/stores/sessionStore';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Glass } from '@/components/ui/Glass';
import axios from 'axios';
import { getAuthHeaders } from '@/stores/authStore';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WEB_ORIGIN = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

function AgentCallRoomContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { endSession, inviteUrl, setInviteUrl } = useSessionStore();
  const { addToast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [showInvitePrompt, setShowInvitePrompt] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenAndSession = async () => {
      try {
        const headers = getAuthHeaders();
        // Fetch LiveKit token
        const tokenRes = await axios.get(`${API_BASE}/api/sessions/${id}/token`, { headers });
        setLivekitToken(tokenRes.data.livekitToken);

        // Fetch session details to recover inviteUrl if navigated directly
        const sessionRes = await axios.get(`${API_BASE}/api/sessions/${id}`, { headers });
        if (sessionRes.data.inviteToken) {
          const url = `${WEB_ORIGIN}/join/${sessionRes.data.inviteToken}`;
          setInviteUrl(url);
          setShowInvitePrompt(true);
        }
      } catch (err) {
        addToast('Failed to connect to room', 'error');
      }
    };
    fetchTokenAndSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (inviteUrl) setShowInvitePrompt(true);
  }, [inviteUrl]);

  const handleEndCall = useCallback(async () => {
    try {
      await endSession(id);
    } catch {
      // best-effort
    }
    addToast('Call ended', 'info');
    router.push('/dashboard');
  }, [id, endSession, addToast, router]);

  const copyInviteLink = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        addToast('Invite link copied!', 'success');
        setShowInvitePrompt(false);
      } catch {
        addToast('Failed to copy', 'error');
      }
    }
  };

  const handleNewChatMessage = useCallback(() => {
    if (!isChatOpen) setHasUnreadChat(true);
  }, [isChatOpen]);

  if (!livekitToken || !LIVEKIT_URL) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <>
      {showInvitePrompt && inviteUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <Glass className="p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Session Created 🎉</h3>
            <p className="text-sm text-text-secondary">
              Share this invite link with your customer to start the call:
            </p>
            <code className="block font-mono text-xs bg-bg-overlay px-3 py-2 rounded-lg text-accent break-all border border-bg-border">
              {inviteUrl}
            </code>
            <div className="flex gap-3">
              <Button variant="primary" onClick={copyInviteLink} className="flex-1">
                Copy Link
              </Button>
              <Button variant="ghost" onClick={() => setShowInvitePrompt(false)}>
                Dismiss
              </Button>
            </div>
          </Glass>
        </div>
      )}

      <LiveKitRoom
        video={true}
        audio={true}
        token={livekitToken}
        serverUrl={LIVEKIT_URL}
        connect={true}
        onDisconnected={handleEndCall}
      >
        <CallRoom
          isChatOpen={isChatOpen}
          hasUnreadChat={hasUnreadChat}
          showEndCall
          showLeave={false}
          remoteName="Customer"
          remoteInitials="C"
          localName="You (Agent)"
          localInitials="A"
          onToggleChat={() => {
            setIsChatOpen((prev) => !prev);
            setHasUnreadChat(false);
          }}
          onEndCall={handleEndCall}
          chatPanel={
            <ChatPanel
              sessionId={id}
              onNewMessage={handleNewChatMessage}
            />
          }
        />
      </LiveKitRoom>
    </>
  );
}

export default function AgentCallRoomPage() {
  return (
    <ProtectedRoute requiredRole="AGENT">
      <AgentCallRoomContent />
    </ProtectedRoute>
  );
}