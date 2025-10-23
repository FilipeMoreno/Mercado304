import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
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
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 with React Compiler
  reactCompiler: true,
  turbopack: {
    root: '.',
  },
  fontLoaders: [
    {
      loader: '@next/font/google',
      options: {
        subsets: ['latin'],
        timeout: 30000, // 30 segundos
      },
    },
  ],
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'],
    // Enable modern ESM externals
    esmExternals: true,
    esmExternals: true,
  },
  // Server external packages (moved from experimental)
  serverExternalPackages: ['@prisma/client'],

  // Environment variables
  env: {
    OPTIMIZE_API_KEY: process.env.OPTIMIZE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  },

  // Optimize bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Separate vendor chunks for better caching
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name: 'lib',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Image optimization for better performance
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for better performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default pwaConfig(nextConfig);