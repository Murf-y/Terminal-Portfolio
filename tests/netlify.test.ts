import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

/** Netlify _headers: a path line, then indented "Name: value" lines. Comments start with #. */
function parseHeaders(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>()
  let current: Map<string, string> | undefined
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    if (!line.startsWith(' ')) {
      current = new Map()
      rules.set(line.trim(), current)
      continue
    }
    if (current === undefined) throw new Error(`Header line before any path: ${line}`)
    const separator = line.indexOf(':')
    current.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  return rules
}

describe('public/_headers', () => {
  const rules = parseHeaders(read('public/_headers'))

  it('sends the security headers on every path', () => {
    expect(Object.fromEntries(rules.get('/*') ?? [])).toEqual({
      'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000',
    })
  })

  it('caches fingerprinted build assets for a year', () => {
    expect(rules.get('/_astro/*')?.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
  })
})

describe('public/_redirects', () => {
  it('permanently redirects the old research page to the Research section', () => {
    const rules = read('public/_redirects')
      .split('\n')
      .filter((line) => line.trim() !== '' && !line.startsWith('#'))
      .map((line) => line.trim().split(/\s+/))
    expect(rules).toEqual([['/research', '/#research', '301']])
  })
})

describe('netlify.toml', () => {
  it('builds with Astro and publishes its output directory', () => {
    const config = read('netlify.toml')
    expect(config).toMatch(/^\s*command = "npm run build"$/m)
    expect(config).toMatch(/^\s*publish = "dist"$/m)
  })
})

describe('Node version', () => {
  it('pins one exact version in .nvmrc and package.json engines', () => {
    const nvmrc = read('.nvmrc').trim()
    const { engines } = JSON.parse(read('package.json')) as { engines: { node: string } }
    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/)
    expect(engines.node).toBe(nvmrc)
  })
})
