import { defineConfig } from 'astro/config'

// Fully static output: every page is plain HTML. Interactivity comes from small bundled scripts,
// and the terminal is fetched only when someone opens it.
export default defineConfig({
  site: 'https://charbelfayad.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /about.html instead of /about/index.html, so canonical URLs have no trailing slash.
    format: 'file',
    // Inline the (small) stylesheet so first paint needs no extra request.
    inlineStylesheets: 'always',
  },
  prefetch: {
    // Opt-in: only links marked data-astro-prefetch (internal pages) are fetched on hover or
    // focus, so same-origin files such as the résumé PDF are never downloaded speculatively.
    defaultStrategy: 'hover',
    prefetchAll: false,
  },
})
