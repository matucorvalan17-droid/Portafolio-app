// WealthTrack — Tailwind CSS Configuration
// This file controls all the custom colors, fonts, and animations.
// Edit the colors here to change the whole app's color scheme.
// Learn more: https://tailwindcss.com/docs/configuration

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── COLORS ─────────────────────────────────────────────────
      // Edit these hex values to change the app's color scheme
      colors: {
        background:      '#050508',   // main page background
        surface:         '#0d0d14',   // card/panel backgrounds
        'surface-2':     '#13131e',   // slightly lighter surface
        border:          '#1e1e2e',   // border color
        'border-2':      '#2a2a3e',   // lighter border
        primary:         '#6366f1',   // indigo — main brand color
        'primary-hover': '#5557d4',   // darker for hover states
        gain:            '#22c55e',   // green — for profits/gains
        loss:            '#ef4444',   // red — for losses
        warning:         '#f59e0b',   // amber — for warnings
        'text-primary':  '#f8f8fc',   // main text
        'text-secondary':'#8888a8',   // secondary/muted text
        'text-muted':    '#5c5c78',   // very muted text
      },

      // ── FONTS ───────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // ── BACKGROUNDS ────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary':  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-gain':     'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-loss':     'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      },

      // ── ANIMATIONS ─────────────────────────────────────────────
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'float':       'float 6s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },

      // ── SHADOWS ─────────────────────────────────────────────────
      boxShadow: {
        'glow-primary': '0 0 30px rgba(99, 102, 241, 0.3)',
        'glow-gain':    '0 0 20px rgba(34, 197, 94, 0.2)',
        'glow-loss':    '0 0 20px rgba(239, 68, 68, 0.2)',
        'card':         '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover':   '0 8px 32px rgba(0, 0, 0, 0.5)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

export default config;
