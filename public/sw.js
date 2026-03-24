const CACHE_NAME = 'tallyrally-v2'
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = e.request.url
  if (
    e.request.method !== 'GET' ||
    url.includes('firestore') ||
    url.includes('googleapis') ||
    url.includes('firebase')
  ) {
    return
  }

  // Navigation requests (HTML) use network-first so index.html is always fresh.
  // Serving stale HTML from cache causes Safari to receive old JS hashes → Vercel
  // rewrites the missing asset path to index.html → text/html MIME type error.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  )
})
