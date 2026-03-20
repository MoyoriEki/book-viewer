const CACHE = 'bookviewer-v1';
const PRECACHE = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://moyorieki.github.io/storage-bridge/storage-bridge.css',
  'https://moyorieki.github.io/storage-bridge/storage-bridge.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache Dropbox API calls
  if (url.hostname.includes('dropbox') || url.hostname.includes('dropboxapi')) return;

  // Network-first for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const c = r.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, c));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.ok && e.request.method === 'GET') {
          const c = r.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, c));
        }
        return r;
      });
    })
  );
});
