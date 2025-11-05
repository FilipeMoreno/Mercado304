// Service Worker para desenvolvimento - Modo Offline
// Este SW permite acesso offline básico sem precisar fazer build

const CACHE_NAME = 'mercado304-dev-v1';
const OFFLINE_URL = '/offline';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[SW Dev] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW Dev] Cache opened');
      // Pré-cache de páginas essenciais
      return cache.addAll([
        '/',
        '/offline',
      ]).catch((error) => {
        console.log('[SW Dev] Pre-cache failed:', error);
      });
    })
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[SW Dev] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW Dev] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;

  // Ignorar requisições do Hot Reload do Next.js
  if (event.request.url.includes('/_next/webpack-hmr')) return;
  if (event.request.url.includes('/__nextjs_original-stack-frame')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta é boa, cachear
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Offline - tentar buscar do cache
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          console.log('[SW Dev] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Se for navegação e não há cache, retornar a página atual (SPA)
        if (event.request.mode === 'navigate') {
          console.log('[SW Dev] Navigation offline, trying index');
          const indexCache = await caches.match('/');
          if (indexCache) {
            return indexCache;
          }
        }

        // Último recurso
        return new Response('Offline - sem cache disponível', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});

console.log('[SW Dev] Service Worker loaded');
