'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface CallToolbarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isChatOpen: boolean;
  hasUnreadChat: boolean;
  showEndCall: boolean;
  showLeave?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
  onLeave?: () => void;
  // Recording
  isRecording?: boolean;
  isRecordingProcessing?: boolean;
  recordingFileUrl?: string | null;
  onToggleRecording?: () => void;
}

export function CallToolbar({
  isMicOn,
  isCameraOn,
  isChatOpen,
  hasUnreadChat,
  showEndCall,
  showLeave,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onEndCall,
  onLeave,
  isRecording = false,
  isRecordingProcessing = false,
  recordingFileUrl,
  onToggleRecording,
}: CallToolbarProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="h-16 bg-bg-float/80 backdrop-blur-glass border-t border-bg-border/50 flex items-center justify-center gap-2 px-4 flex-shrink-0"
    >
      {/* Mic */}
      <ToolbarButton
        active={isMicOn}
        onClick={onToggleMic}
        label={isMicOn ? 'Mute' : 'Unmute'}
        ariaLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {!isMicOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="2" width="12" height="12" rx="6" />
            <path d="M12 18v-4" />
            <path d="M8 14a4 4 0 0 0 8 0" />
            <path d="M3 20l18-18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="2" width="12" height="12" rx="6" />
            <path d="M12 18v-4" />
            <path d="M8 14a4 4 0 0 0 8 0" />
          </svg>
        )}
      </ToolbarButton>

      {/* Camera */}
      <ToolbarButton
        active={isCameraOn}
        onClick={onToggleCamera}
        label={isCameraOn ? 'Camera Off' : 'Camera On'}
        ariaLabel={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
      >
        {!isCameraOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        )}
      </ToolbarButton>

      {/* Chat */}
      <ToolbarButton
        active={isChatOpen}
        onClick={onToggleChat}
        label="Chat"
        ariaLabel="Toggle chat"
        badge={hasUnreadChat && !isChatOpen ? '!' : undefined}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </ToolbarButton>

      {/* Recording button (agent only) */}
      {onToggleRecording && (
        <ToolbarButton
          active={isRecording || isRecordingProcessing}
          onClick={onToggleRecording}
          label={isRecordingProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
          ariaLabel={isRecording ? 'Stop recording' : 'Start recording'}
          disabled={isRecordingProcessing}
          className={isRecording ? 'text-danger' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </ToolbarButton>
      )}

      {/* Spacer */}
      <div className="w-8" />

      {/* End Call / Leave */}
      {showEndCall && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEndCall}
          className="w-11 h-11 rounded-full bg-danger hover:bg-danger/80 flex items-center justify-center transition-colors"
          aria-label="End call"
          title="End call"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22.7 8.7a15.7 15.7 0 0 0-21.4 0c-.7.7-.7 1.8 0 2.5l2 2c.6.6 1.5.6 2.1 0a4.7 4.7 0 0 1 6.2-.3c.3.3.7.4 1 .4s.7-.1 1-.4a4.7 4.7 0 0 1 6.2.3c.6.6 1.5.6 2.1 0l2-2c.7-.7.7-1.8 0-2.5z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </motion.button>
      )}

      {showLeave && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEndCall}
          className="flex items-center gap-2 px-4 h-11 rounded-full bg-bg-overlay hover:bg-bg-float text-text-primary transition-colors border border-bg-border text-sm font-medium"
          aria-label="Leave call"
          title="Leave call"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Leave
        </motion.button>
      )}

      {/* Download recording link */}
      {recordingFileUrl && (
        <a
          href={recordingFileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-xs text-accent hover:underline"
        >
          Download Recording
        </a>
      )}
    </motion.div>
  );
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
  children: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  className?: string;
}

function ToolbarButton({ active, onClick, label, ariaLabel, children, badge, disabled, className }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 
        ${active ? 'bg-accent/20 text-accent' : 'bg-bg-overlay text-text-secondary hover:text-text-primary hover:bg-bg-float'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className || ''}
      `}
      aria-label={ariaLabel}
      title={label}
    >
      {children}
      {/* Badge */}
      {badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
      {/* Recording pulse */}
      {active && label?.includes('Stop') && (
        <span className="absolute inset-0 rounded-full animate-ping bg-danger/30" />
      )}
    </button>
  );
}