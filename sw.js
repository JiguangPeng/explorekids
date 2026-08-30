/* ==========================================================================
   Service Worker · 离线缓存 + 可安装（PWA）
   策略：网络优先、离线回退缓存；安装时预缓存应用外壳
   ========================================================================== */
const CACHE = 'explorekids-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/storage.js',
  './js/chat-data.js',
  './js/outing-data.js',
  './js/recommend.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/icon-source.svg',
  './assets/icons/literacy.svg',
  './assets/icons/english-learning.svg',
  './assets/icons/lego-animal-park.svg',
  './assets/icons/building-blocks.svg',
  './assets/icons/three-little-pigs.svg',
  './assets/icons/paper-airplane.svg',
  './assets/icons/trampoline.svg',
  './assets/icons/pull-up-bar.svg',
  './assets/icons/sit-ups.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 网络优先：在线时始终拿到最新代码，离线时回退到缓存
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((r) => {
          if (r) return r;
          // 页面导航离线兜底：返回缓存的 index.html
          if (req.mode === 'navigate') return caches.match('./index.html');
          return undefined;
        })
      )
  );
});
