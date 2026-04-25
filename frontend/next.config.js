/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'remark-parse', 'unified', 'bail', 'is-plain-obj', 'trough', 'vfile', 'vfile-message', 'unist-util-visit', 'unist-util-is', 'hast-util-to-jsx-runtime', 'hast-util-whitespace', 'property-information', 'space-separated-tokens', 'comma-separated-tokens', 'devlop'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}
module.exports = nextConfig
