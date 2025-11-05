const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // IMPORTANTE: Desabilitar em dev facilita o debug, mas para testar offline precisa estar habilitado
  disable: false, // Mudado para false para permitir testes offline em dev
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
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias para melhor suporte offline
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Dashboard payment stats - cache leve com SWR
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/dashboard\/payment-stats(\?.*)?$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'dashboard-payment-stats',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 5, // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Estratégia NetworkFirst para dados de estoque e listas (mais dinâmicos)
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/(stock|shopping-lists|purchases|desperdicios|recipes)($|\/).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'dynamic-data-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias para melhor suporte offline
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        networkTimeoutSeconds: 10, // Timeout maior para dar mais tempo em conexões lentas
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
    // Estratégia NetworkFirst para APIs de autenticação (com fallback para offline)
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/auth\/get-session/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'auth-session-cache',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24, // 1 dia
        },
        cacheableResponse: {
          statuses: [200],
        },
        networkTimeoutSeconds: 3,
      },
    },
    // Outras APIs de auth e admin sem cache (NetworkOnly)
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/(auth\/(?!get-session)|user|admin)($|\/).*/i,
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
    // Navegação geral - Suporte completo offline
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
        },
        networkTimeoutSeconds: 5, // Timeout maior para conexões lentas
        plugins: [
          {
            fetchDidFail: async ({ request }) => {
              // Em caso de falha, tentar buscar do cache
              const cache = await caches.open('pages-cache');
              const cachedResponse = await cache.match(request);
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não há cache, redirecionar para página offline não funciona aqui
              // O middleware irá lidar com acesso offline
              return undefined;
            },
          },
        ],
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Comentado temporariamente - problema com Windows e caracteres : em nomes de arquivo
  cacheComponents: false,
  reactCompiler: true,
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-cosmos.bluesoft.com.br',
        port: '',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.mercado.filipemoreno.com.br',
        port: '',
        pathname: '/**',
      },
    ],
    qualities: [25, 50, 75, 90, 100],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    OPTIMIZE_API_KEY: process.env.OPTIMIZE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // PostHog rewrites and trailing slash support
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
}

module.exports = withPWA(nextConfig)

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "filipe-moreno",
    project: "mercado-304",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);