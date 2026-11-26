/* 교대핏 service worker v2.5.4
   목표: 온라인에서는 항상 최신 파일, 오프라인에서는 앱 껍데기 캐시
   - install  : 새 캐시에 자산을 미리 담고 바로 대기 해제(skipWaiting)
   - activate : 구버전 캐시(yongko-shift-*) 전부 삭제 + clients.claim()
   - fetch    : 같은 출처는 네트워크 우선(Network-First). 성공하면 캐시 갱신 후 반환,
                실패(오프라인)일 때만 캐시 폴백 → 구버전 CSS/JS가 섞이는 현상 원천 차단
*/
var VERSION = '2.5.4';
var CACHE = 'yongko-shift-v2.5.4';   /* VERSION 올릴 때 여기도 같이 */
var ASSETS = [
  './',
  './index.html',
  './app.css?v=' + VERSION,
  './app.js?v=' + VERSION,
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        /* 한 파일이 없어도 install이 통째로 실패하지 않게 개별 처리 */
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* 외부(폰트 CDN 등): 네트워크 그대로, 실패하면 캐시 */
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  var isDoc = req.mode === 'navigate';
  /* 화면·CSS·JS·JSON은 중간 캐시를 믿지 않고 서버에 재확인 */
  var revalidate = isDoc || /\.(?:html|css|js|json)$/i.test(url.pathname) ||
    url.pathname === '/' || url.pathname.slice(-1) === '/';

  e.respondWith(
    fetch(req, revalidate ? { cache: 'no-cache' } : undefined).then(function (res) {
      if (res && res.status === 200 && res.type !== 'opaque') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () { });
      }
      return res;
    }).catch(function () {
      /* 오프라인 폴백 */
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (isDoc) {
          return caches.match('./index.html', { ignoreSearch: true }).then(function (h) {
            return h || caches.match('./');
          });
        }
        return undefined;
      }).then(function (r) { return r || Response.error(); })
    })
  );
});
