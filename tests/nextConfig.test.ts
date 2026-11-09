import { describe, expect, it } from 'vitest'
import nextConfig from '../next.config.js'

type Header = { key: string; value: string }

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`next.config.js defines no ${name}`)
  return value
}

async function headersFor(source: string): Promise<Record<string, string>> {
  const rules: Array<{ source: string; headers: Header[] }> = await required(nextConfig.headers, 'headers')()
  const rule = rules.find((r) => r.source === source)
  if (rule === undefined) throw new Error(`no header rule for ${source}; rules: ${JSON.stringify(rules)}`)
  return Object.fromEntries(rule.headers.map((h) => [h.key, h.value]))
}

describe('next.config.js', () => {
  it('serves screenshots as-is, so /_next/image does no server-side image work', () => {
    expect(nextConfig.images).toEqual({ unoptimized: true })
  })

  it('forbids framing in both the modern and the legacy header', async () => {
    const headers = await headersFor('/:path*')
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('locks down base, object and form targets without restricting scripts (GA must keep working)', async () => {
    const csp = (await headersFor('/:path*'))['Content-Security-Policy']
    expect(csp.split('; ')).toEqual([
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ])
    expect(csp, 'a script-src here would block the inline theme and GA scripts').not.toMatch(/script-src|default-src/)
  })

  it('sets the remaining hardening headers', async () => {
    const headers = await headersFor('/:path*')
    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000',
    })
  })

  it('keeps the /research redirect permanent', async () => {
    expect(await required(nextConfig.redirects, 'redirects')()).toEqual([
      { source: '/research', destination: '/#research', permanent: true },
    ])
  })
})
