const CACHE_NAME = 'mercado304-custom-v1'
const DYNAMIC_CACHE = 'mercado304-dynamic-v1'

// Recursos para cache dinâmico (APIs importantes)
const CACHE_STRATEGIES = {
  // Network first para APIs críticas com fallback
  networkFirst: [
    /\/api\/dashboard\/stats/,
    /\/api\/products/,
    /\/api\/categories/,
    /\/api\/brands/,
    /\/api\/markets/,
  ],

  // Stale while revalidate para dados menos críticos
  staleWhileRevalidate: [
    /\/api\/stock/,
    /\/api\/waste/,
    /\/api\/shopping-lists/,
    /\/api\/recipes/,
    /\/api\/purchases/,
  ]
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }

  // Network First for critical APIs
  if (CACHE_STRATEGIES.networkFirst.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request))
    return
  }

  // Stale While Revalidate for less critical APIs
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
})

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Sem conexão', offline: true })
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}