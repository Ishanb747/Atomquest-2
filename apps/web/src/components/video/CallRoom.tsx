'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CallToolbar } from './CallToolbar';
import { VideoTile } from './VideoTile';
import { slideInRight } from '@/lib/motion';
import {
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useToast } from '@/components/ui/Toast';

interface CallRoomProps {
  isChatOpen: boolean;
  hasUnreadChat: boolean;
  showEndCall: boolean;
  showLeave?: boolean;
  remoteName?: string;
  remoteInitials?: string;
  localName?: string;
  localInitials?: string;
  onToggleChat: () => void;
  onEndCall: () => void;
  chatPanel?: React.ReactNode;
}

export function CallRoom({
  isChatOpen,
  hasUnreadChat,
  showEndCall,
  showLeave,
  remoteName = 'Remote',
  remoteInitials = 'R',
  localName = 'You',
  localInitials = 'Y',
  onToggleChat,
  onEndCall,
  chatPanel,
}: CallRoomProps) {
  const { addToast } = useToast();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const hasRemote = remoteParticipants.length > 0;
  const firstRemote = hasRemote ? remoteParticipants[0] : null;

  // Retrieve tracks
  const localVideoTrack = useTracks([Track.Source.Camera]).find((t) => t.participant.identity === localParticipant.identity);
  const remoteVideoTrack = useTracks([Track.Source.Camera]).find((t) => t.participant.identity === firstRemote?.identity);

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col">
      <RoomAudioRenderer />
      
      {/* Main video area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {hasRemote && firstRemote ? (
          /* Remote video — full area */
          <div className="w-full h-full">
            <VideoTile
              participant={firstRemote}
              trackRef={remoteVideoTrack}
              name={remoteName}
              initials={remoteInitials}
              isActive
              fullscreen
            />
          </div>
        ) : (
          /* Waiting state */
          <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-bg-float flex items-center justify-center"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </motion.div>
            <p className="text-text-secondary text-sm font-medium">
              Waiting for {remoteName} to join...
            </p>
            <p className="text-text-tertiary text-xs">
              {showEndCall ? 'Share the invite link to connect' : 'You\'re connected — waiting for the agent'}
            </p>
          </div>
        )}

        {/* Local video (PiP) */}
        <motion.div
          drag
          dragMomentum={false}
          className="fixed bottom-24 right-4 w-44 rounded-xl overflow-hidden border border-video-border shadow-float z-30 bg-video-bg cursor-grab active:cursor-grabbing"
          style={{ aspectRatio: '16/9' }}
        >
          <VideoTile
            participant={localParticipant}
            trackRef={localVideoTrack}
            name={localName}
            initials={localInitials}
            isLocal
            mirrored
          />
        </motion.div>
      </div>

      {/* Chat panel */}
      {isChatOpen && chatPanel && (
        <motion.div
          variants={slideInRight}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed right-0 top-0 h-full w-[320px] bg-bg-float/90 backdrop-blur-glass border-l border-bg-border/60 z-40 flex flex-col"
        >
          {chatPanel}
        </motion.div>
      )}

      {/* Toolbar */}
      <CallToolbar
        isMicOn={isMicrophoneEnabled}
        isCameraOn={isCameraEnabled}
        isChatOpen={isChatOpen}
        hasUnreadChat={hasUnreadChat}
        onToggleMic={async () => {
          if (!navigator.mediaDevices) {
            addToast('Camera & Mic are blocked on non-HTTPS connections. Use localhost or HTTPS.', 'error');
            return;
          }
          try {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
          } catch (err: any) {
            addToast(`Failed to access mic: ${err.message}`, 'error');
          }
        }}
        onToggleCamera={async () => {
          if (!navigator.mediaDevices) {
            addToast('Camera & Mic are blocked on non-HTTPS connections. Use localhost or HTTPS.', 'error');
            return;
          }
          try {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
          } catch (err: any) {
            addToast(`Failed to access camera: ${err.message}`, 'error');
          }
        }}
        onToggleChat={onToggleChat}
        onEndCall={onEndCall}
        showEndCall={showEndCall}
        showLeave={showLeave}
      />
    </div>
  );
}