// ── Easing curves ──────────────────────────────────────
// Apple uses spring, not tween — but keep tweens for micro-anim
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,         // easeOutExpo — fast start, settles softly
  in: [0.4, 0, 1, 1] as const,              // easeInQuart
  inOut: [0.76, 0, 0.24, 1] as const,       // easeInOutQuart
  spring: { type: 'spring', stiffness: 400, damping: 30 } as const,
  springGentle: { type: 'spring', stiffness: 200, damping: 24 } as const,
  springBounce: { type: 'spring', stiffness: 500, damping: 22, mass: 0.8 } as const,
};

// ── Page transitions ───────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: ease.in },
  },
};

// ── Fade-up (lists, cards, anything staggered) ──────────
export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.out } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: ease.in } },
};

// ── Scale-in (modals, popovers, dropdowns) ──────────────
export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: ease.springGentle },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: ease.in } },
};

// ── Slide-in from right (chat panel, sidebars) ─────────
export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: ease.spring },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

// ── Stagger container (wraps a list of fadeUp children) ─
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

// ── Toast/notification pop ──────────────────────────────
export const toastVariants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: ease.springBounce },
  exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.2, ease: ease.in } },
};

// ── Toolbar button press (micro-interaction) ────────────
export const buttonTap = {
  whileTap: { scale: 0.92, transition: { duration: 0.1 } },
  whileHover: { scale: 1.04, transition: ease.spring },
};