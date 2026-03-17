/* eslint-disable no-restricted-globals */
// injection point for vite-plugin-pwa
const wb = self.__WB_MANIFEST || []
const CACHE = 'yanus-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(wb.map(({ url }) => new URL(url, self.location).href)))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match('/index.html').then((r) => r || new Response('Offline')))
  )
})
