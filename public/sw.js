// Service Worker for Instagram Clone PWA
// 기본적인 오프라인 캐싱 지원

const CACHE_NAME = "instagram-clone-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Service Worker 설치
self.addEventListener("install", (event) => {
  console.log("[Service Worker] 설치 중...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] 캐시 열기");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] 활성화 중...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] 오래된 캐시 삭제:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// 네트워크 요청 가로채기 (Cache First 전략)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 캐시 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크 요청
      return fetch(event.request).then((response) => {
        // 응답이 유효하지 않으면 그대로 반환
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // 응답을 복제하여 캐시에 저장
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }),
  );
});
