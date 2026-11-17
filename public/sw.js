// Ownframe offline support (fix X7). Editing and export already run on the device;
// this keeps the app itself available without a connection after the first visit.
//  - pages: network first, cached copy when offline (/edit serves every project)
//  - build assets, fonts, featured music: cache first (their URLs never change)
//  - the music catalogue API and anything else: network only
const CACHE = 'ownframe-v1';
const SHELL = ['/app', '/edit', '/offline.html', '/icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); } return res; })
      .catch(async () => (await caches.match(url.pathname)) || (url.pathname === '/edit' ? caches.match('/edit') : null) || caches.match('/offline.html')));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/music/km/') || url.pathname.startsWith('/icons/') || url.pathname === '/icon.svg') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })));
    return;
  }
  // RSC payloads for client navigation: network, then the cached page so the app keeps working
  if (url.searchParams.has('_rsc')) e.respondWith(fetch(req).catch(() => new Response('', { status: 503 })));
});
