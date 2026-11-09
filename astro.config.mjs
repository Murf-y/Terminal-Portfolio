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
    // Fetch internal pages when their link is hovered or focused.
    defaultStrategy: 'hover',
    prefetchAll: true,
  },
})
