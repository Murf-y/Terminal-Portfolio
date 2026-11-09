/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,ts}'],
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
      // "Inter Fallback" (styles/globals.css) is Arial sized to Inter's metrics, so text does not
      // shift when the web font swaps in.
      sans: ['"Inter Variable"', '"Inter Fallback"', 'system-ui', 'sans-serif'],
      // Terminal text. Declared on every page, but browsers fetch a font only once text uses it,
      // so JetBrains Mono downloads when the terminal first opens.
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      // Page chrome that wants a monospace look without fetching the terminal font.
      'system-mono': ['ui-monospace', 'monospace'],
    },
    screens: {
      sm: '640px',
      // Fits the 560px column, PREVIEW_GAP and PREVIEW_WIDTH (lib/preview.ts) on a 1280px laptop.
      preview: '1280px',
    },
  },
  plugins: [],
}
