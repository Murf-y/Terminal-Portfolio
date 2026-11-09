/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The research page became the Research section on Home.
      { source: '/research', destination: '/#research', permanent: true },
    ]
  },
}
