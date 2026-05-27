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
        // ── Backgrounds (Revolut: canvas-dark / surface-elevated) ─
        background:      '#000000',   // true black — canvas-dark
        surface:         '#0a0a0a',   // surface-deep
        'surface-2':     '#16181a',   // surface-elevated — plan cards, modals
        // ── Borders (Revolut: hairline-dark) ──────────────────────
        border:          'rgba(255,255,255,0.10)',
        'border-2':      'rgba(255,255,255,0.18)',
        // ── Brand (Revolut cobalt violet) ─────────────────────────
        primary:         '#494fdf',   // cobalt violet — brand accent
        'primary-hover': '#4f55f1',   // cobalt bright
        'primary-deep':  '#3a40c4',   // cobalt deep (pressed)
        // ── Semantic ──────────────────────────────────────────────
        gain:            '#00a87e',   // accent-teal — profits
        loss:            '#e23b4a',   // accent-danger — losses
        warning:         '#ec7e00',   // accent-warning — amber
        // ── Text ──────────────────────────────────────────────────
        'text-primary':   '#ffffff',
        'text-secondary': 'rgba(255,255,255,0.72)',
        'text-muted':     '#8d969e',   // stone
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        'card': '20px',    // rounded.lg — feature-card, plan-card
        'input': '12px',   // rounded.md — inputs, chips
      },

      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #494fdf 0%, #4f55f1 100%)',
        'gradient-gain':    'linear-gradient(135deg, #00a87e 0%, #00c896 100%)',
        'gradient-loss':    'linear-gradient(135deg, #e23b4a 0%, #c0262f 100%)',
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
        // Revolut has no drop-shadows — elevation via surface luminance only
        'card':       '0 1px 0 rgba(255,255,255,0.06)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.10)',
        'elevated':   '0 8px 32px rgba(0,0,0,0.6)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

export default config;
