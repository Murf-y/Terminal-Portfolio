/**
 * Response headers for every route. The site has no sessions or forms, so these close the
 * remaining browser-level gaps (framing, MIME sniffing, referrer leakage, plugins, base hijack)
 * without a script-src policy that would have to track Google Analytics' inline snippet.
 */
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
]

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    // Screenshots ship pre-sized in public/ (2x the preview width), so the on-demand optimizer at
    // /_next/image is not needed. Disabling it removes that endpoint's server-side image work,
    // the documented mitigation for Next 13 image-optimizer advisories.
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  async redirects() {
    return [
      // The research page became the Research section on Home.
      { source: '/research', destination: '/#research', permanent: true },
    ]
  },
}
