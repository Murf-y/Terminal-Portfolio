import { getViteConfig } from 'astro/config'

// Astro's Vite config, so tests can render .astro components with the container API and resolve
// the same path aliases as the site.
export default getViteConfig({
  test: {
    // jsdom with the SSR transform; see tests/astro-environment.ts.
    environment: './tests/astro-environment.ts',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.claude'],
    reporters: ['verbose'],
  },
})
