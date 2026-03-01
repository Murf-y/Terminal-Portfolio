/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      // CSS variable-driven for theme switching
      void: 'var(--color-void)',
      surface: 'var(--color-surface)',
      elevated: 'var(--color-elevated)',
      border: 'var(--color-border)',
      muted: 'var(--color-muted)',
      text: 'var(--color-text)',
      bone: 'var(--color-bone)',
      accent: 'var(--color-accent)',
      'accent-dim': 'var(--color-accent-dim)',
      white: '#FFFFFF',
      black: '#000000',
      red: { 400: '#f87171' },
    },
    fontFamily: {
      display: ['"Bebas Neue"', 'serif'],
      'sub-display': ['"Instrument Serif"', 'serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'line-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'line-grow': 'line-grow 1s ease-out both',
      },
    },
  },
  plugins: [],
}
