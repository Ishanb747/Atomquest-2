import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
          'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: [
          'SF Mono', 'ui-monospace', 'Menlo', 'monospace',
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
  },
  plugins: [],
};
export default config;