/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        // All colors now reference CSS custom properties
        // so swapping [data-theme="light"] on <html> flips the entire palette
        bg: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          surface2: 'rgb(var(--color-bg-surface2) / <alpha-value>)',
          surface3: 'rgb(var(--color-bg-surface3) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          hover: 'rgb(var(--color-border-hover) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          dim: 'rgb(var(--color-accent) / 0.12)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
        },
        daily: {
          DEFAULT: 'rgb(var(--color-daily) / <alpha-value>)',
          dim: 'rgb(var(--color-daily) / 0.12)',
        },
        warm: {
          DEFAULT: 'rgb(var(--color-warm) / <alpha-value>)',
          dim: 'rgb(var(--color-warm) / 0.12)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          dim: 'rgb(var(--color-danger) / 0.10)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          dim: 'rgb(var(--color-text-dim) / <alpha-value>)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
