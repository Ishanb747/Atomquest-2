# AtomQuest Hackathon 1.0 — Real-Time Video Support Platform
### Phased Build Prompt Guide

> **How to use this README**
> Each phase below is a self-contained prompt. Feed it (along with any relevant prior-phase code) to your AI coding assistant or use it as your own implementation checklist. Complete one phase fully before moving to the next. Do not skip phases — each one builds the foundation for the next.

---

## Tech Stack Decision (lock this in before Phase 1)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR for invite pages, client components for WebRTC |
| Animations | Framer Motion | Spring physics, layout animations, gesture-driven UI |
| Design System | Custom tokens (Apple-grade palette) | Consistent color, type, motion across all surfaces |
| Signaling | Node.js + Express + Socket.IO | Real-time bidirectional events |
| SFU Media Server | mediasoup v3 | Server-side media routing, no P2P, rules-compliant |
| Database | PostgreSQL + Prisma ORM | Relational session/chat history |
| File Storage | MinIO (S3-compatible) | Self-hosted, bonus file sharing |
| Auth | JWT (short-lived) + invite tokens (UUID) | Role enforcement |
| Recording | mediasoup PlainTransport → FFmpeg | Bonus |
| Metrics | Prometheus + prom-client | Bonus observability |


---

## Architecture Overview

```
Browser (Agent)          Browser (Customer)
     │                        │
     └────────┬───────────────┘
              │  WebRTC (via mediasoup WebRTC Transport)
              ▼
   ┌─────────────────────────┐
   │   Node.js Backend       │
   │  ┌───────────────────┐  │
   │  │  Socket.IO Server │  │  ← Signaling (offer/answer/ICE)
   │  └───────────────────┘  │
   │  ┌───────────────────┐  │
   │  │  mediasoup Router │  │  ← Media routing (SFU)
   │  └───────────────────┘  │
   │  ┌───────────────────┐  │
   │  │  REST API         │  │  ← Sessions, chat, roles
   │  └───────────────────┘  │
   └─────────────────────────┘
              │
   ┌──────────┴──────────┐
   │    PostgreSQL        │   MinIO (files + recordings)
   └─────────────────────┘
```

---

## Phase 0 — Project Scaffold & Environment

**Prompt:**

```
Set up a monorepo with two workspaces:
  - /apps/web       → Next.js 14 app (App Router, TypeScript, Tailwind CSS)
  - /apps/server    → Node.js Express + Socket.IO + mediasoup (TypeScript)

Root-level tooling:
  - pnpm workspaces
  - ESLint + Prettier (shared config)

Local service setup (run these manually before starting dev):
  PostgreSQL:
    Install locally or use a free managed instance (e.g. Neon, Supabase free tier,
    or a local pg install). Set DATABASE_URL in .env.

  MinIO:
    Download and run the MinIO binary directly:
      curl -O https://dl.min.io/server/minio/release/linux-amd64/minio
      chmod +x minio && ./minio server ./data --console-address :9001
    Runs on port 9000 (API) and 9001 (console). Set MINIO_* vars in .env.

  Backend: node --watch src/index.ts (port 4000)
  Frontend: pnpm dev (port 3000)

In /apps/server:
  - Install: express, socket.io, mediasoup, prisma, @prisma/client,
    jsonwebtoken, uuid, cors, dotenv, multer, prom-client
  - Create a .env.example with:
      DATABASE_URL, JWT_SECRET, MEDIASOUP_LISTEN_IP,
      MEDIASOUP_ANNOUNCED_IP, MINIO_ENDPOINT, MINIO_ACCESS_KEY,
      MINIO_SECRET_KEY, PORT

In /apps/web:
  - Install: socket.io-client, mediasoup-client, axios, zustand, clsx

Create a /prisma/schema.prisma with these models:
  - Session { id, agentId, status, inviteToken, createdAt, endedAt }
  - Participant { id, sessionId, role (AGENT|CUSTOMER), joinedAt, leftAt }
  - Message { id, sessionId, senderId, role, content, fileUrl, createdAt }
  - Recording { id, sessionId, status (RECORDING|PROCESSING|READY), fileUrl, createdAt }

Run prisma migrate dev --name init.

Deliverable: pnpm dev from root starts both apps with no errors.
```

---

## Phase 0.5 — Design System (Do This Before Any UI)

> Set this up once. Every component in Phases 3–11 pulls from it.
> The goal: every screen feels like it was shipped by Apple — not because it copies Apple,
> but because it follows the same underlying principles: restraint, depth, motion with purpose.

**Prompt:**

```
Install Framer Motion and set up the design system for /apps/web.

pnpm add framer-motion

────────────────────────────────────────────────────────────
1. COLOR TOKENS — tailwind.config.ts
────────────────────────────────────────────────────────────

Extend the Tailwind theme with this palette. The UI is DARK-FIRST.

  theme: {
    extend: {
      colors: {

        // ── Backgrounds ──────────────────────────────────
        bg: {
          base:    '#000000',   // true black (like Apple.com dark)
          raised:  '#0A0A0A',   // slightly lifted surface
          overlay: '#111111',   // cards, panels
          float:   '#1A1A1A',   // modals, popovers (glass over overlay)
          border:  '#2A2A2A',   // all dividers and input borders
        },

        // ── Text ─────────────────────────────────────────
        text: {
          primary:   '#F5F5F7',   // Apple's near-white primary text
          secondary: '#A1A1A6',   // secondary / metadata
          tertiary:  '#6E6E73',   // placeholders, disabled
          inverse:   '#000000',   // text on light/accent fills
        },

        // ── Accent — ONE accent color, used sparingly ────
        // Clean electric blue (Apple's link/action blue)
        accent: {
          DEFAULT:  '#0A84FF',   // primary CTA, active states
          hover:    '#409CFF',   // on hover
          muted:    '#0A84FF1A', // 10% opacity fill (pill bg, etc.)
          glow:     '#0A84FF33', // 20% opacity for glow halos
        },

        // ── Semantic ──────────────────────────────────────
        success: '#30D158',   // green — call active, connected
        warning: '#FFD60A',   // yellow — reconnecting, processing
        danger:  '#FF453A',   // red — end call, recording, error
        info:    '#64D2FF',   // light blue — info toasts

        // ── Video surfaces ────────────────────────────────
        video: {
          bg:      '#0D0D0D',   // video tile background (near black)
          border:  '#2C2C2E',   // video tile border
          overlay: '#00000080', // 50% black scrim over video
        },
      },

      // ── Typography ─────────────────────────────────────
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'
        ],
        mono: [
          'SF Mono', 'ui-monospace', 'Menlo', 'monospace'
        ],
      },

      fontWeight: {
        thin:       '100',
        light:      '300',
        regular:    '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
      },

      // ── Radii ──────────────────────────────────────────
      borderRadius: {
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '24px',
        'pill': '9999px',
      },

      // ── Shadows (Apple uses soft, dark, directional) ───
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)',
        'float':   '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        'glow':    '0 0 20px rgba(10,132,255,0.25)',
        'danger':  '0 0 20px rgba(255,69,58,0.3)',
        'success': '0 0 20px rgba(48,209,88,0.2)',
      },

      // ── Backdrop blur ──────────────────────────────────
      backdropBlur: {
        'glass': '20px',
        'heavy': '40px',
      },
    },
  }

────────────────────────────────────────────────────────────
2. ANIMATION TOKENS — lib/motion.ts
────────────────────────────────────────────────────────────

Export these Framer Motion variants and transition presets.
Import them anywhere instead of writing inline animation objects.

// Easing curves (Apple uses spring, not tween — but keep tweens for micro-anim)
export const ease = {
  out:     [0.16, 1, 0.3, 1],       // easeOutExpo — fast start, settles softly
  in:      [0.4, 0, 1, 1],          // easeInQuart
  inOut:   [0.76, 0, 0.24, 1],      // easeInOutQuart
  spring:  { type: 'spring', stiffness: 400, damping: 30 },
  springGentle: { type: 'spring', stiffness: 200, damping: 24 },
  springBounce: { type: 'spring', stiffness: 500, damping: 22, mass: 0.8 },
}

// Page transitions (used on route change wrappers)
export const pageVariants = {
  initial:  { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)',
              transition: { duration: 0.4, ease: ease.out } },
  exit:     { opacity: 0, y: -8, filter: 'blur(4px)',
              transition: { duration: 0.25, ease: ease.in } },
}

// Fade-up (lists, cards, anything staggered)
export const fadeUp = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.out } },
  exit:     { opacity: 0, y: 8,  transition: { duration: 0.2,  ease: ease.in } },
}

// Scale-in (modals, popovers, dropdowns)
export const scaleIn = {
  initial:  { opacity: 0, scale: 0.94 },
  animate:  { opacity: 1, scale: 1,
              transition: ease.springGentle },
  exit:     { opacity: 0, scale: 0.96,
              transition: { duration: 0.15, ease: ease.in } },
}

// Slide-in from right (chat panel, sidebars)
export const slideInRight = {
  initial:  { opacity: 0, x: 24 },
  animate:  { opacity: 1, x: 0, transition: ease.spring },
  exit:     { opacity: 0, x: 16, transition: { duration: 0.2 } },
}

// Stagger container (wraps a list of fadeUp children)
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
}

// Toast/notification pop
export const toastVariants = {
  initial:  { opacity: 0, y: 12, scale: 0.95 },
  animate:  { opacity: 1, y: 0,  scale: 1, transition: ease.springBounce },
  exit:     { opacity: 0, y: 8,  scale: 0.96,
              transition: { duration: 0.2, ease: ease.in } },
}

// Toolbar button press (micro-interaction)
export const buttonTap = {
  whileTap: { scale: 0.92, transition: { duration: 0.1 } },
  whileHover: { scale: 1.04, transition: ease.spring },
}

────────────────────────────────────────────────────────────
3. GLASSMORPHISM UTILITY — components/ui/Glass.tsx
────────────────────────────────────────────────────────────

A reusable glass surface used for:
  - Modals
  - In-call floating toolbar
  - Chat panel background
  - Video overlay controls

const Glass = ({ children, className, ...props }) => (
  <div
    className={cn(
      'bg-bg-float/70 backdrop-blur-glass border border-bg-border/60',
      'shadow-float rounded-xl',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

Usage: wrap any floating/overlay element in <Glass>.

────────────────────────────────────────────────────────────
4. BUTTON COMPONENT — components/ui/Button.tsx
────────────────────────────────────────────────────────────

Variants:
  primary    → bg-accent text-text-inverse, glow shadow on hover
  ghost      → transparent, border border-bg-border, text-text-primary
  danger     → bg-danger/10 text-danger border border-danger/30
  icon       → square, rounded-xl, ghost styling, icon only

All variants:
  - motion.button with whileTap scale: 0.92
  - transition: spring (400, 30)
  - Cursor: pointer
  - Disabled: opacity-40, cursor-not-allowed, no hover effect
  - Focus visible: ring-2 ring-accent/50 outline-none

const buttonVariants = {
  primary: 'bg-accent hover:bg-accent-hover text-text-inverse shadow-glow
            hover:shadow-[0_0_28px_rgba(10,132,255,0.4)]',
  ghost:   'bg-transparent border border-bg-border text-text-primary
            hover:bg-bg-overlay hover:border-bg-border/80',
  danger:  'bg-danger/10 border border-danger/30 text-danger
            hover:bg-danger/20',
  icon:    'bg-bg-overlay border border-bg-border text-text-secondary
            hover:text-text-primary hover:bg-bg-float',
}

────────────────────────────────────────────────────────────
5. VIDEO TILE COMPONENT — components/video/VideoTile.tsx
────────────────────────────────────────────────────────────

This is the most visible UI element. Make it feel premium.

Layout:
  - Rounded-2xl, overflow-hidden
  - bg-video-bg (dark fill when camera is off)
  - border border-video-border
  - Aspect ratio: 16/9 (use aspect-video Tailwind class)
  - When active: shadow-[0_0_0_2px_rgba(10,132,255,0.6)] ring (live indicator)

Camera-off state:
  - Center the participant's initials in a circle
  - Circle: 72px, bg-bg-float, text-text-secondary, font-semibold text-2xl
  - Subtle animated pulse on the initials circle using Framer Motion:
      animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3 }}

Name label (bottom-left overlay):
  - Positioned absolute bottom-3 left-3
  - Glass pill: bg-bg-overlay/70 backdrop-blur-glass px-3 py-1 rounded-pill
  - text-text-primary text-sm font-medium
  - Animate in with fadeUp variant on mount

Muted indicator (bottom-right):
  - Show a mic-off icon pill (danger color) when audio is muted
  - Animate with scaleIn

────────────────────────────────────────────────────────────
6. CALL TOOLBAR — components/video/CallToolbar.tsx
────────────────────────────────────────────────────────────

Position: fixed bottom-8, centered horizontally (left-1/2 -translate-x-1/2)
Container: Glass component, px-4 py-3, flex gap-3, rounded-2xl

Buttons (left to right):
  MicButton   → icon variant, active: text-text-primary | muted: danger variant
  CameraButton→ icon variant, same pattern
  ChatButton  → icon variant, badge dot when unread messages
  [gap / divider]
  EndCall     → danger variant, wider, label "End Call" (agent only)

Mount animation:
  <motion.div
    initial={{ y: 24, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.4, ...ease.springGentle }}
  >

Active state ring:
  When mic/camera is ON: icon fills with text-text-primary
  When OFF: icon color goes danger, button gets bg-danger/10 bg

────────────────────────────────────────────────────────────
7. PAGE TRANSITION WRAPPER — components/layout/PageTransition.tsx
────────────────────────────────────────────────────────────

Wrap every page layout with:

<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
</AnimatePresence>

Apply this in /app/layout.tsx or per-page as needed.

────────────────────────────────────────────────────────────
8. TOAST / NOTIFICATION SYSTEM — components/ui/Toast.tsx
────────────────────────────────────────────────────────────

Position: top-center, fixed, z-50, pt-4

Each toast:
  - Glass surface
  - Icon (colored dot by severity) + message text
  - Auto-dismiss after 3s (with countdown progress line at bottom)
  - Exit animation: scaleIn reversed

Variants by type:
  info:    left border-l-4 border-accent
  success: left border-l-4 border-success
  warning: left border-l-4 border-warning
  error:   left border-l-4 border-danger

Use AnimatePresence with layoutId for smooth reordering.

────────────────────────────────────────────────────────────
9. GLOBAL STYLES — app/globals.css
────────────────────────────────────────────────────────────

  html, body {
    background-color: #000000;
    color: #F5F5F7;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Remove all default focus rings; use custom ring-accent instead */
  *:focus { outline: none; }
  *:focus-visible { outline: 2px solid rgba(10, 132, 255, 0.6); outline-offset: 2px; }

  /* Scrollbar — dark, thin, invisible until hover */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3A3A3C; border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: #636366; }

  /* Video element — no default controls chrome */
  video { object-fit: cover; background: #0D0D0D; }

  /* Selection color */
  ::selection { background: rgba(10, 132, 255, 0.3); color: #F5F5F7; }

────────────────────────────────────────────────────────────
10. TYPOGRAPHY SCALE (use these classes consistently)
────────────────────────────────────────────────────────────

  Display:     text-4xl font-bold tracking-tight text-text-primary
               (hero text on join page, session ended screens)

  Heading:     text-2xl font-semibold tracking-tight text-text-primary

  Subheading:  text-lg font-medium text-text-primary

  Body:        text-sm font-regular text-text-primary leading-relaxed

  Secondary:   text-sm text-text-secondary

  Caption:     text-xs text-text-tertiary tracking-wide uppercase

  Code/Token:  font-mono text-xs bg-bg-overlay px-2 py-0.5 rounded-sm
               text-accent (for invite tokens, session IDs)

────────────────────────────────────────────────────────────
REFERENCE SCREENS (what each major page should feel like)
────────────────────────────────────────────────────────────

/login
  - Full black background
  - Centered card (Glass), max-w-sm, scaleIn on mount
  - Large logo/wordmark at top (SF Pro Display bold)
  - Input fields: bg-bg-overlay border-bg-border, focus ring accent
  - "Sign In" button: primary variant, full width
  - No header, no sidebar — pure focus

/dashboard
  - Narrow sidebar (240px) with nav items, bg-bg-raised
  - Main area: bg-bg-base
  - Session cards: Glass surface, fadeUp stagger on load
  - "New Session" CTA: primary button, top right
  - Empty state: centered, icon + subheading + CTA

/session/[id] (call room)
  - bg-bg-base fills entire screen
  - Remote video: large, rounded-2xl, center of screen
  - Local video: picture-in-picture, bottom-right,
    w-48 rounded-xl border border-video-border shadow-float
    Draggable with Framer Motion drag prop
  - Chat panel: slides in from right (slideInRight variant),
    fixed 320px, full height, Glass surface
  - Toolbar: floating at bottom center
  - Recording indicator: pulsing red dot in top-right corner
    animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}

/join/[token]
  - Minimal: centered, black background
  - Support brand mark at top
  - "You've been invited to a support session" — Display size
  - Camera preview (small, rounded-xl) below heading
  - "Join Call" primary button — large, full-width on mobile
  - Entry animation: entire card fades up from y: 20

Deliverable: Create /apps/web/lib/motion.ts, update tailwind.config.ts,
create Glass.tsx, Button.tsx (all variants), VideoTile.tsx (with camera-off state),
CallToolbar.tsx (layout only, no wiring yet), PageTransition.tsx, Toast.tsx,
and globals.css. No backend calls needed in this phase — just Storybook-style
renders or a /dev page to preview all components together.
```

---

## Phase 1 — Session Management (Backend)

**Prompt:**

```
In /apps/server, build the session management REST API.

Endpoints to implement:

POST /api/sessions
  - Agent-only (JWT required, role must be AGENT)
  - Creates a new Session record with status=ACTIVE
  - Generates a UUID invite token and stores it on the session
  - Returns: { sessionId, inviteToken, inviteUrl }

GET /api/sessions/:id
  - JWT required (any role)
  - Returns session details + participant list + status

POST /api/sessions/:id/join
  - Accepts inviteToken in body (no JWT needed for customer)
  - Validates token matches the session
  - Creates a Participant record (role=CUSTOMER, joinedAt=now)
  - Returns a short-lived JWT: { token, sessionId, role: "CUSTOMER" }

POST /api/sessions/:id/end
  - Agent-only (JWT required, role must be AGENT)
  - Sets session status=ENDED, endedAt=now
  - Sets leftAt on all open Participant records
  - Returns: { ok: true }

GET /api/sessions/:id/history
  - JWT required
  - Returns full session: participants (join/leave times, duration), messages

Middleware:
  - authenticateJWT: decode token, attach req.user = { id, role, sessionId }
  - requireRole(role): 403 if req.user.role !== role

Agent login (for demo purposes):
POST /api/auth/agent-login
  - Body: { username, password } (hardcoded demo credentials are fine)
  - Returns: { token } with role=AGENT in payload

Deliverable: All endpoints testable via curl or Postman.
```

---

## Phase 2 — mediasoup SFU Setup (Backend)

**Prompt:**

```
In /apps/server, integrate mediasoup as the SFU media layer.

Step 1 — mediasoup Worker & Router:
  - On server start, create one mediasoup Worker
  - Create a Router per active session (store in a Map<sessionId, Router>)
  - Use these codecs: VP8 (video), opus (audio)
  - Router should be cleaned up when session ends

Step 2 — Socket.IO signaling namespace /media:
  All events are authenticated via a JWT passed in socket handshake auth.

  Client → Server events:
    getRouterRtpCapabilities  → reply with router.rtpCapabilities
    createWebRtcTransport     → create a WebRtcTransport, reply with
                                { id, iceParameters, iceCandidates,
                                  dtlsParameters, sctpParameters }
    connectTransport          → call transport.connect({ dtlsParameters })
    produce                   → call transport.produce({ kind, rtpParameters })
                                reply with { id }
    consume                   → call router.consume({ producerId, rtpCapabilities })
                                reply with { id, producerId, kind, rtpParameters }
    resumeConsumer            → call consumer.resume()

  Server → Client events:
    newProducer               → broadcast to other peers in session
                                payload: { producerId, peerId, kind }
    peerLeft                  → broadcast when a peer disconnects
                                payload: { peerId }

Step 3 — Peer state management:
  - Maintain a Map<socketId, { sessionId, peerId, transports, producers, consumers }>
  - On socket disconnect: close all transports, broadcast peerLeft,
    update Participant.leftAt in DB

Deliverable: Two browser tabs can exchange video/audio mediated entirely
through the mediasoup Router (verify in browser devtools — ICE candidates
should all be your server IP, not the peer's).
```

---

## Phase 3 — Agent Frontend (Session Create + Call UI)

**Prompt:**

```
In /apps/web, build the agent-facing pages.

Pages:
  /login          → Simple form: username + password → POST /api/auth/agent-login
                    Store JWT in memory (Zustand store), not localStorage.

  /dashboard      → Agent dashboard (protected route)
                    - "New Session" button → POST /api/sessions → show invite link
                    - List of past sessions with status badges
                    - Each session row links to /session/[id]

  /session/[id]   → The main call room (agent view)

Call Room UI (agent):
  - Two video elements: localVideo (self) + remoteVideo (customer)
  - Toolbar buttons:
      Mute / Unmute mic  (toggle local audio track enabled)
      Camera On / Off    (toggle local video track enabled)
      End Call           (POST /api/sessions/:id/end, then redirect to /dashboard)
  - Chat panel (right sidebar): message list + text input + send button
  - Copy invite link button

WebRTC flow (implement using mediasoup-client):
  1. GET routerRtpCapabilities from signaling socket
  2. Create mediasoup Device, load capabilities
  3. Create send transport → produce audio + video from getUserMedia
  4. Create recv transport → consume remote tracks on newProducer event
  5. Render remote tracks into remoteVideo element

Deliverable: Agent can create a session, see their own camera, and
see the invite link ready to share.
```

---

## Phase 4 — Customer Frontend (Join Flow + Call UI)

**Prompt:**

```
In /apps/web, build the customer-facing pages.

Pages:
  /join/[token]   → Customer join page
                    - On load: POST /api/sessions/:id/join with token
                    - Show a "Join Call" button (do not auto-join)
                    - On join success: store JWT, redirect to /room/[sessionId]

  /room/[id]      → The call room (customer view)
                    - Same video + toolbar layout as agent room
                    - NO "End Call" button (customers cannot end sessions)
                    - NO "New Session" or admin controls
                    - Show a "Leave" button that closes the customer's
                      connection locally but does NOT call /api/sessions/:id/end

Access control:
  - If a customer tries to access /dashboard → redirect to /join
  - If an agent tries to access /join/[token] → redirect to /dashboard
  - If the invite token is invalid or session is ENDED → show a
    clear error page: "This invite link is invalid or has expired."

Deliverable: Full end-to-end call works. Agent creates session,
copies link, opens it in a second browser/incognito, joins as customer,
both see and hear each other. Media routes through your server (confirm
no direct P2P connection in browser network tab).
```

---

## Phase 5 — In-Call Chat

**Prompt:**

```
Add real-time text chat to both room pages (/session/[id] and /room/[id]).

Backend (Socket.IO namespace /chat):
  Events:
    Client → Server:
      sendMessage  → payload: { sessionId, content }
                     Validate JWT, save Message to DB, broadcast to room

    Server → Client:
      newMessage   → payload: { id, senderId, role, content, createdAt }
      chatHistory  → sent on join, payload: Message[] for this sessionId

REST endpoint (already in Phase 1 history, but confirm):
  GET /api/sessions/:id/messages  → returns all messages sorted by createdAt

Frontend:
  - Chat sidebar shows scrollable message list
  - Each message shows: sender role badge (AGENT / CUSTOMER),
    timestamp, and message content
  - Hitting Enter or clicking Send emits sendMessage
  - On join, listen for chatHistory and populate the list
  - Auto-scroll to bottom on new messages

Deliverable: Agent and customer can exchange text messages.
After call ends, GET /api/sessions/:id/messages returns full chat history.
```

---

## Phase 6 — Roles, Access Control & Edge Cases

**Prompt:**

```
Harden the system against the reliability edge cases the judges will test.

1. Duplicate join prevention:
   - If a customer tries to join a session already at capacity (1 customer),
     return 409 with message: "Session is already in progress."

2. Invalid / expired invite handling:
   - If inviteToken does not match any session → 404
   - If session status is ENDED → 403 with message: "This session has ended."

3. Session cleanup on unexpected disconnect:
   - Socket.IO 'disconnect' event handler must:
       a. Set Participant.leftAt = now in DB
       b. If the disconnected peer was the AGENT and no other agent exists,
          automatically call the session-end logic
       c. Emit peerLeft to remaining peers

4. JWT expiry enforcement:
   - Tokens expire in 8 hours (enough for a hackathon demo)
   - Return 401 with { error: "TOKEN_EXPIRED" } on expiry
   - Frontend intercepts 401 and redirects to appropriate login/join page

5. Session state sync on reconnect (basic):
   - On socket reconnect, re-emit getRouterRtpCapabilities and
     re-establish transports (full reconnect, not seamless — that's Phase 9)

6. Input validation:
   - Sanitize all chat message content (strip HTML)
   - Validate sessionId and token format on all endpoints

Deliverable: Run through this checklist manually:
  ✅ Invalid invite link shows error page
  ✅ Ended session invite shows error page
  ✅ Agent disconnect ends the session
  ✅ Customer disconnect does NOT end the session
  ✅ Expired token returns 401 and redirects correctly
```

---

## Phase 7 — Recording (Bonus)

**Prompt:**

```
Implement server-side call recording using mediasoup PlainTransport + FFmpeg.

Backend:
  Add to the mediasoup session state:
    - plainTransport (for piping RTP)
    - ffmpegProcess (child_process)

  New Socket.IO events (AGENT only):
    startRecording  → 
      1. Create a PlainTransport on the mediasoup Router
      2. Connect the PlainTransport to receive RTP from each producer
      3. Spawn an FFmpeg process:
           ffmpeg -protocol_whitelist file,rtp,udp
                  -i <sdp_file>
                  -c:v copy -c:a aac
                  /tmp/recording-<sessionId>.mp4
      4. Create a Recording record in DB with status=RECORDING
      5. Emit recordingStarted to the room

    stopRecording   →
      1. Send SIGTERM to FFmpeg process
      2. Update Recording status=PROCESSING
      3. Upload the .mp4 to MinIO bucket "recordings"
      4. Update Recording status=READY, set fileUrl
      5. Emit recordingReady { downloadUrl } to agent

  New REST endpoint:
    GET /api/sessions/:id/recording
      → Returns { status, downloadUrl } for the session's recording

Frontend (agent call room):
  - Add "Start Recording" / "Stop Recording" button to toolbar
  - Button shows current state: idle → recording (red dot) → processing → ready
  - When recordingReady event arrives, show a "Download Recording" link

MinIO setup:
  - Bucket: "recordings", policy: private (pre-signed URLs for download)
  - Generate a presigned GET URL (15 min expiry) for the download link

Deliverable: Agent can start/stop recording. After stopping, a downloadable
.mp4 appears in the agent's UI. File is accessible in MinIO console.
```

---

## Phase 8 — File Sharing in Chat (Bonus)

**Prompt:**

```
Allow participants to share files (images, PDFs, documents) in the chat.

Backend:
  New REST endpoint:
    POST /api/sessions/:id/upload
      - JWT required (any role)
      - Accept multipart/form-data with a single file field "file"
      - Allowed types: image/jpeg, image/png, image/gif,
                       application/pdf, text/plain,
                       application/msword, application/vnd.openxmlformats...
      - Max size: 20MB (reject with 413 if exceeded)
      - Upload to MinIO bucket "chat-files" under key sessions/<sessionId>/<uuid>.<ext>
      - Generate a presigned GET URL (24h expiry)
      - Save a Message record with fileUrl set, content = filename
      - Broadcast via Socket.IO newMessage with { fileUrl, fileName, fileType }
      - Return: { fileUrl, fileName }

Frontend:
  - Add a paperclip icon button next to the chat input
  - On click: open file picker (accept same MIME types as above)
  - Show upload progress bar in the chat input area
  - After upload, the message appears in chat:
      - Images: render inline as a thumbnail (max 200px wide)
      - PDFs / docs: render as a styled link with file icon and filename

Session history:
  - GET /api/sessions/:id/messages already returns messages with fileUrl
  - In the history view (admin dashboard or agent dashboard), linked files
    must still be accessible via the presigned URL

Deliverable: An image shared in chat displays inline for both participants.
A PDF shows as a downloadable link. Files are retrievable from session history.
```

---

## Phase 9 — Reconnection Handling (Bonus)

**Prompt:**

```
Implement graceful reconnection with a 30-second grace window.

The goal: if a participant's network drops briefly, they should
rejoin seamlessly without the other party being notified.

Backend changes:
  1. Do NOT immediately broadcast peerLeft or update Participant.leftAt
     on socket disconnect. Instead:
       - Mark the peer as "disconnecting" in your in-memory peer map
       - Set a 30-second timer using setTimeout
       - If they reconnect before the timer fires: cancel the timer,
         re-attach their transports, emit peerRejoined to the room
       - If the timer fires: execute the normal leave logic
         (broadcast peerLeft, update DB, clean up mediasoup state)

  2. New Socket.IO event:
       rejoin  → payload: { sessionId } (JWT auth, same peerId as before)
                  Cancel the disconnect timer for this peerId
                  Re-establish the mediasoup consumer/producer mapping
                  Emit rejoinSuccess { producerIds: [...] } back to client

Frontend changes:
  1. Socket.IO client config:
       reconnection: true,
       reconnectionAttempts: 10,
       reconnectionDelay: 1000,
       reconnectionDelayMax: 5000

  2. On reconnect event:
       - Show a non-blocking toast: "Reconnecting..."
       - Emit rejoin with sessionId
       - On rejoinSuccess: re-consume all listed producerIds silently
       - Dismiss the toast: "Reconnected"

  3. If reconnection fails (all attempts exhausted or grace window expires):
       - Show modal: "Connection lost. The session has ended."
       - Redirect to dashboard / home

Deliverable: Simulate a network drop (DevTools → Network → Offline for 10s,
then back Online). Neither participant should see any interruption in the call.
```

---

## Phase 10 — Admin Dashboard (Bonus)

**Prompt:**

```
Build a web-based admin dashboard at /admin (agent-only, same JWT auth).

Page: /admin

Sections:

1. Live Sessions panel:
   - Polls GET /api/admin/sessions?status=ACTIVE every 5 seconds
   - Shows: session ID, agent name, customer status,
     call duration (time since createdAt), participant count
   - "Force End" button per session → POST /api/admin/sessions/:id/force-end
     (same logic as agent end-call but callable by admin)

2. Session History panel:
   - GET /api/admin/sessions?status=ENDED
   - Table with columns: Session ID, Date, Duration, Participants, Chat (link), Recording (link if available)
   - Clicking a row expands to show full participant join/leave timeline

3. Backend admin endpoints:
   GET /api/admin/sessions          → list all sessions, filterable by status
   POST /api/admin/sessions/:id/force-end  → forcibly end any active session

   Both endpoints require AGENT role JWT (for now; in production
   you'd add a separate ADMIN role).

UI notes:
   - Status badges: ACTIVE (green), ENDED (gray), RECORDING (red pulse)
   - Duration displayed as HH:MM:SS, live-counting for active sessions
   - Mobile-responsive table (horizontal scroll on small screens)

Deliverable: Admin can see all live sessions, force-end one, and view
full history with expandable event logs.
```

---

## Phase 11 — Observability (Bonus)

**Prompt:**

```
Expose Prometheus-compatible metrics from the backend server.

Install: prom-client

Metrics to expose:

  video_support_active_sessions (Gauge)
    → Increment on session create, decrement on session end

  video_support_connected_participants (Gauge)
    → Increment on socket join, decrement on socket leave/disconnect

  video_support_sessions_total (Counter)
    → Increment on every new session created
    → Label: { status: "created" | "ended" }

  video_support_messages_total (Counter)
    → Increment on every chat message sent

  video_support_errors_total (Counter)
    → Increment on any caught error in request handlers
    → Labels: { route, error_type }

  video_support_mediasoup_producers_active (Gauge)
    → Increment when a producer is created, decrement when closed

Endpoint:
  GET /metrics   → Returns Prometheus text format
                   Content-Type: text/plain; version=0.0.4

Middleware:
  Wrap all Express route handlers in a try/catch that increments
  video_support_errors_total before re-throwing.

Optional (if time allows):
  - Add a /admin/metrics page in the frontend with a simple
    live-updating chart (poll /metrics every 10s, parse text format,
    display active_sessions and connected_participants as line charts)

Deliverable: curl http://localhost:4000/metrics returns well-formed
Prometheus metrics. Verify by connecting it to a local Prometheus
instance or just confirming the text format is valid.
```

---

## Phase 12 — Polish, Security Hardening & Demo Prep

**Prompt:**

```
Final pass before submission. Work through this checklist:

Security:
  ✅ All POST/PUT/DELETE endpoints require valid JWT (verify middleware coverage)
  ✅ File uploads: MIME type validated server-side (not just client-side)
  ✅ File uploads: Filename sanitized before storing in MinIO
  ✅ CORS: allow only your frontend origin, not "*"
  ✅ Rate limiting on POST /api/sessions and POST /api/sessions/:id/join
     (use express-rate-limit: 10 req/min per IP)
  ✅ Invite tokens are single-use or session-scoped (cannot be reused
     after session ends)

UX:
  ✅ Loading states on all async actions (joining, starting call, sending files)
  ✅ Error boundaries on call room page (crash does not leave blank screen)
  ✅ Empty state on dashboard when no sessions exist
  ✅ Mobile-friendly layout on the call room (camera + chat stack vertically)
  ✅ Clear visual indicator when mic is muted or camera is off (red icon)

Architecture diagram:
  Create /docs/architecture.png showing:
    - Browser (Agent) ← Socket.IO + WebRTC → Node.js Server
    - Browser (Customer) ← Socket.IO + WebRTC → Node.js Server
    - Node.js Server ← Prisma → PostgreSQL
    - Node.js Server ← MinIO SDK → MinIO
    - mediasoup Router inside Node.js Server
    - Prometheus scraping /metrics

README (final):
  ✅ Prerequisites (Node 18+, pnpm, PostgreSQL, MinIO binary)
  ✅ One-command dev start: pnpm dev (starts both web and server concurrently)
  ✅ Demo credentials: agent login + a test invite link
  ✅ Known limitations (single mediasoup Worker = single server,
     no horizontal scaling in this build)
  ✅ Link to architecture diagram

Submission checklist:
  ✅ GitHub repo with clean commit history
  ✅ /docs/architecture.png committed
  ✅ .env.example with all required keys (no real secrets)
  ✅ Screen-recorded demo: agent creates session → customer joins
     via link → both on video → chat exchange → end call
  ✅ README covers setup + known limitations
```

---

## Phase Order Summary

| Phase | What Gets Built | Must-Have / Bonus |
|---|---|---|
| 0 | Scaffold, DB schema, local services | Foundation |
| 0.5 | Design system (tokens, motion, components) | Foundation |
| 1 | Session REST API + JWT auth | Must-Have |
| 2 | mediasoup SFU + Socket.IO signaling | Must-Have |
| 3 | Agent UI (create session, call room) | Must-Have |
| 4 | Customer UI (join flow, call room) | Must-Have |
| 5 | In-call chat (real-time + persisted) | Must-Have |
| 6 | Edge cases, access control, hardening | Must-Have |
| 7 | Recording (mediasoup → FFmpeg → MinIO) | Bonus |
| 8 | File sharing in chat | Bonus |
| 9 | Reconnection grace window | Bonus |
| 10 | Admin dashboard | Bonus |
| 11 | Prometheus metrics | Bonus |
| 12 | Polish, security, demo prep | Submission |

> **Minimum viable demo for judges (Phases 0–6):** Agent creates session → Customer joins via link → Both on video/audio → Chat works → Call ends cleanly → History queryable.
>
> **Full-marks submission (all phases):** All of the above + Recording download + File sharing + Reconnection + Admin dashboard + /metrics endpoint.