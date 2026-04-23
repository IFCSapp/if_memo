const SW_VERSION = 'v1.2.0';
const CACHE_NAME = `restart-memo-${SW_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(APP_SHELL);

            // ★ 追加：全クライアントに通知
            const clients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });
            clients.forEach(client => {
                client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
            });
        })()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // ナビゲーション要求は index.html を返せるようにする
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 同一オリジンの静的ファイルは cache-first
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
