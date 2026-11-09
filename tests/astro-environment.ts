import { type Environment, builtinEnvironments } from 'vitest/runtime'

/**
 * jsdom globals, with every file transformed by Vite's SSR pipeline. The client pipeline compiles
 * .astro files to a stub that throws, so components must go through SSR, as they do in the build.
 */
export default {
  ...builtinEnvironments.jsdom,
  name: 'astro-jsdom',
  viteEnvironment: 'ssr',
} satisfies Environment
