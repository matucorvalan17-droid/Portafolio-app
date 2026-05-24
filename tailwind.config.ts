import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ───────────────────────────────────────────
        background:      '#050505',   // pure near-black
        surface:         '#0c0c0c',   // card / panel
        'surface-2':     '#131313',   // slightly elevated surface
        // ── Borders ───────────────────────────────────────────────
        border:          '#1e1e1e',
        'border-2':      '#2a2a2a',
        // ── Brand (electric green) ────────────────────────────────
        primary:         '#00e676',   // electric green — CTAs, links, focus
        'primary-hover': '#00c85a',   // darker on hover
        // ── Semantic ──────────────────────────────────────────────
        gain:            '#00e676',   // profits — same green family as brand
        loss:            '#ff3b30',   // losses — vivid iOS red
        warning:         '#ffb300',   // amber warnings
        // ── Text ──────────────────────────────────────────────────
        'text-primary':   '#f0f0f0',
        'text-secondary': '#888888',
        'text-muted':     '#505050',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #00e676 0%, #00bfa5 100%)',
        'gradient-gain':    'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
        'gradient-loss':    'linear-gradient(135deg, #ff3b30 0%, #d32f2f 100%)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'float':      'float 6s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },

      boxShadow: {
        'glow-primary': '0 0 32px rgba(0, 230, 118, 0.28)',
        'glow-gain':    '0 0 20px rgba(0, 230, 118, 0.18)',
        'glow-loss':    '0 0 20px rgba(255, 59,  48,  0.18)',
        'card':         '0 4px 24px rgba(0, 0, 0, 0.6)',
        'card-hover':   '0 8px 40px rgba(0, 0, 0, 0.7)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

export default config;
