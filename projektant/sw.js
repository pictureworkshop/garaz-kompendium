/* Service worker – projektant (offline) */
const CACHE = 'projektant-v4';
const ASSETS = [
  './', './index.html', './app.js', './manifest.webmanifest', './drawings.js', './view3d.js', '../shared/lib/three.min.js',
  '../shared/style.css', '../shared/common.js', '../shared/garage-calc.js',
  '../shared/icons/projektant-192.png', '../shared/icons/projektant-512.png', '../shared/icons/projektant-apple-180.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('projektant-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Najpierw sieć (świeże wersje), przy braku sieci – pamięć podręczna
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
