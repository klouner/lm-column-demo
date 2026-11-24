// Офлайн-режим: сначала сеть (чтобы обновления приходили сразу), при её отсутствии — сохранённая копия
const CACHE = 'propisi-v1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/notebook.js', 'js/glyphs.js', 'js/curriculum.js', 'js/store.js', 'js/audio.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
