// 폰 앱 오프라인: 화면 파일은 폰에 저장해 두고(인터넷 있으면 새것으로 갈아 끼움), 없으면 저장본으로 연다.
// 데이터(Supabase)는 여기서 손대지 않는다 — 앱이 마지막 화면을 따로 저장한다.
const CACHE = 'jh-app-v3';
// 폰 알림(웹 푸시): 맥 업무판이 보낸 것을 띄우고, 누르면 앱을 연다
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch { d = { body: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'JH 업무판', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'jh' }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => { const w = l.find(c => c.url.startsWith(self.registration.scope)); return w ? w.focus() : clients.openWindow(self.registration.scope); }));
});
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;
  if (url.origin === location.origin) {  // 우리 화면: 인터넷 먼저, 안 되면 저장본
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {  // 라이브러리·글꼴: 저장본 먼저
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
