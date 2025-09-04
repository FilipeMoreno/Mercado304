const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
      {
        urlPattern: ({ url }) => url.origin === self.location.origin,
        handler: 'NetworkOnly',
        options: {
          cacheName: 'offline-cache',
          plugins: [
            {
              cacheKeyWillBeUsed: async ({ request }) => {
                return request.url;
              },
              handlerDidError: async () => {
                return Response.redirect('/offline', 302);
              },
            },
          ],
        },
      },
    ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  env: {
    OPTIMIZE_API_KEY: process.env.OPTIMIZE_API_KEY
  },
}

module.exports = withPWA(nextConfig)