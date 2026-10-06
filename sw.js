const CACHE = 'sgbuddy-shell-v20';
const SHELL = ['/', '/styles.css', '/app-v080.js', '/manifest.webmanifest', '/sgbuddy-icon-v2.png', '/sgbuddy-icon-v2.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', event => event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))), self.clients.claim()])));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(res => { const copy=res.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return res; }).catch(()=>caches.match(event.request)));
});
