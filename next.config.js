/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'qrcode'],
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
