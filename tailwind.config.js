/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      // Theme tokens, defined per theme in styles/globals.css
      bg: 'var(--color-bg)',
      text: 'var(--color-text)',
      muted: 'var(--color-muted)',
      rule: 'var(--color-rule)',
      outline: 'var(--color-outline)',
      // Terminal-only tokens
      accent: 'var(--color-accent)',
      error: 'var(--color-error)',
      terminal: {
        bg: 'var(--color-terminal-bg)',
        bar: 'var(--color-terminal-bar)',
        border: 'var(--color-terminal-border)',
        title: 'var(--color-terminal-title)',
      },
      black: '#000000',
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
    },
    screens: {
      sm: '640px',
      // Fits the 560px column, PREVIEW_GAP and PREVIEW_WIDTH (lib/preview.ts) on a 1280px laptop.
      preview: '1280px',
    },
  },
  plugins: [],
}
