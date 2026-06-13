'use client';

import { Glass } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { VideoTile } from '@/components/video/VideoTile';
import { CallToolbar } from '@/components/video/CallToolbar';
import { PageTransition } from '@/components/layout/PageTransition';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function DevContent() {
  const { addToast } = useToast();

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            Design System Preview
          </h1>
          <p className="text-text-secondary text-sm">
            AtomQuest — Apple-grade dark-first UI component library
          </p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /></svg>
            </Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        {/* Glass card */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Glass Surface</h2>
          <Glass className="p-6 max-w-md">
            <p className="text-text-primary text-sm">
              This is a Glass card. It has backdrop blur, a semi-transparent background,
              and subtle border. Used for modals, panels, toolbars, and overlays.
            </p>
          </Glass>
        </section>

        {/* Video Tiles */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Video Tiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <VideoTile
              name="Agent"
              initials="AG"
              isMuted={false}
              isActive
            />
            <VideoTile
              name="Customer"
              initials="CU"
              isMuted
              isActive={false}
            />
          </div>
        </section>

        {/* Toolbar */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Call Toolbar</h2>
          <div className="h-32 relative">
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
        </section>

        {/* Toast triggers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Toasts</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" onClick={() => addToast('Info: Something happened', 'info')}>
              Info Toast
            </Button>
            <Button variant="primary" onClick={() => addToast('Success: Call connected', 'success')}>
              Success Toast
            </Button>
            <Button variant="danger" onClick={() => addToast('Warning: Reconnecting...', 'warning')}>
              Warning Toast
            </Button>
            <Button variant="danger" onClick={() => addToast('Error: Connection failed', 'error')}>
              Error Toast
            </Button>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

export default function DevPage() {
  return (
    <ToastProvider>
      <DevContent />
    </ToastProvider>
  );
}