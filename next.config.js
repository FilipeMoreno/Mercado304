const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Configurações adicionais para melhor compatibilidade
  scope: '/',
  sw: 'sw.js',
  publicExcludes: ['!manifest.json', '!sw.js', '!workbox-*.js'],
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Estratégia StaleWhileRevalidate para dados de produtos
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/(products|brands|categories|markets)($|\/).*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-data-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Estratégia NetworkFirst para dados de estoque e listas (mais dinâmicos)
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/(stock|shopping-lists|purchases)($|\/).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'dynamic-data-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 2, // 2 dias
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        networkTimeoutSeconds: 5,
      },
    },
    // Estratégia CacheFirst para imagens
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
        },
      },
    },
    // Estratégia NetworkOnly para APIs de autenticação e sensíveis
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/(auth|user|admin)($|\/).*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'auth-no-cache',
      },
    },
    // Fallback para páginas offline
    {
      urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/_next/'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
        },
      },
    },
    // Navegação geral com fallback para offline
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 dia
        },
        plugins: [
          {
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-cosmos.bluesoft.com.br',
        port: '',
        pathname: '/products/**',
      },
    ],
    qualities: [25, 50, 75, 90, 100],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    OPTIMIZE_API_KEY: process.env.OPTIMIZE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  }
}

module.exports = withPWA(nextConfig)