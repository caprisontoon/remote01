// 웹앱(PWA) 서비스 워커: 설치한 웹 리모컨이 인터넷이 잠깐 끊겨도 열리게 하고, 새 배포는 다음 실행 때 바로 반영한다.
// - 페이지(index.html): 네트워크 먼저 → 실패하면 저장본. 그래서 새 버전을 올리면 다음에 열 때 새 화면이 뜬다.
// - assets/ (파일 이름에 해시가 붙은 JS·CSS·폰트·이미지): 저장본 먼저 → 없으면 받아서 저장.
const CACHE = 'toona-remote-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./'))),
    );
    return;
  }
  if (new URL(req.url).pathname.includes('/assets/') || new URL(req.url).pathname.includes('/icons/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
