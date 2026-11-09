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
      // Terminal-only accents
      accent: 'var(--color-accent)',
      black: '#000000',
      red: { 400: '#f87171' },
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
    },
    screens: {
      sm: '640px',
      // Wide enough for the 560px column plus the 48px gap and 320px project preview.
      preview: '1320px',
    },
  },
  plugins: [],
}
