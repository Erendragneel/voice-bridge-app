/* Voice Bridge's own shell. Translation models use the runtime's browser cache. */
const CACHE_PREFIX = 'voice-bridge-app-pwa-';
const SHELL_CACHE = CACHE_PREFIX + 'shell-dd66ea944a24';
const SHELL = [
  './', './index.html', './app.css', './app.js', './engine.js',
  './conversation-capture.js', './browser-bridge.js', './translator-worker.js', './install.js',
  './manifest.webmanifest', './privacy.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './vendor/transformers.min.js', './vendor/ort-wasm-simd-threaded.jsep.mjs',
  './vendor/ort-wasm-simd-threaded.jsep.wasm'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const old=(await caches.keys()).filter(key=>key.startsWith(CACHE_PREFIX)&&key!==SHELL_CACHE);
    await Promise.all(old.map(key=>caches.delete(key)));await self.clients.claim();
    // Older app versions have no update listener. Reload their windows once so
    // the new HTML and scripts are loaded together from this complete cache.
    if(old.length){for(const client of await self.clients.matchAll({type:'window'})){if(client.url.startsWith(self.registration.scope))await client.navigate(client.url).catch(()=>{});}}
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || request.headers.has('range')) return;
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const canonical = new Request(url.origin + url.pathname);
    const hit = await cache.match(request) || await cache.match(canonical);
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return hit || (request.mode === 'navigate' ? await cache.match('./index.html') : null) || Response.error();
    }
  })());
});
