'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, scaleIn } from '@/lib/motion';
import { Participant, Track } from 'livekit-client';
import { useIsSpeaking, useIsMuted, VideoTrack, TrackReferenceOrPlaceholder } from '@livekit/components-react';

interface VideoTileProps {
  participant: Participant;
  trackRef?: TrackReferenceOrPlaceholder;
  initials?: string;
  name?: string;
  isActive?: boolean;
  isLocal?: boolean;
  mirrored?: boolean;
  fullscreen?: boolean;
}

export function VideoTile({
  participant,
  trackRef,
  initials = '?',
  name = 'Participant',
  isActive = false,
  isLocal = false,
  mirrored = false,
  fullscreen = false,
}: VideoTileProps) {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted(Track.Source.Microphone, { participant });
  const hasVideo = trackRef?.publication?.isSubscribed && trackRef?.participant?.isCameraEnabled;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className={cn(
        'relative overflow-hidden bg-video-bg transition-shadow duration-200',
        fullscreen ? 'w-full h-full' : 'rounded-2xl border border-video-border aspect-video',
        isActive && !fullscreen && 'shadow-[0_0_0_2px_rgba(10,132,255,0.6)] ring-2 ring-accent/60',
        isSpeaking && !fullscreen && 'shadow-[0_0_0_3px_rgba(10,132,255,0.9)] ring-[3px] ring-accent'
      )}
    >
      {/* Speaking glow pulse animation */}
      {isSpeaking && (
        <div className={cn("absolute inset-0 pointer-events-none z-10", !fullscreen && "rounded-2xl")}>
          <motion.div
            className={cn("absolute inset-0 ring-[3px] ring-accent", !fullscreen && "rounded-2xl")}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Video element managed by LiveKit */}
      {hasVideo && trackRef && (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            'w-full h-full object-cover',
            mirrored && 'scale-x-[-1]'
          )}
        />
      )}

      {/* Camera-off state: initials circle with pulse */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-[72px] h-[72px] rounded-full bg-bg-float flex items-center justify-center"
          >
            <span className="text-text-secondary font-semibold text-2xl">
              {initials.slice(0, 2).toUpperCase()}
            </span>
          </motion.div>
        </div>
      )}

      {/* Speaking indicator badge */}
      {isSpeaking && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-3 left-3 bg-accent px-2 py-0.5 rounded-pill flex items-center gap-1 z-20"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-[10px] font-semibold tracking-wide">LIVE</span>
        </motion.div>
      )}

      {/* Name label — bottom-left glass pill */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="absolute bottom-3 left-3 bg-bg-overlay/70 backdrop-blur-glass px-3 py-1 rounded-pill z-20"
      >
        <span className="text-text-primary text-sm font-medium">{name}</span>
      </motion.div>

      {/* Muted indicator — bottom-right */}
      {isMuted && (
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          className="absolute bottom-3 right-3 bg-danger/80 backdrop-blur-glass px-2 py-1 rounded-pill flex items-center gap-1.5 z-20"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}