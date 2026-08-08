const CACHE_NAME = "dadboy-pos-v1";

const APP_SHELL = [

  "/",

  "/index.html",

];

// ตอนติดตั้ง Service Worker

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches

      .open(CACHE_NAME)

      .then((cache) => {

        return cache.addAll(APP_SHELL);

      })

  );

  self.skipWaiting();

});

// ลบ cache รุ่นเก่า

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches

      .keys()

      .then((cacheNames) => {

        return Promise.all(

          cacheNames

            .filter(

              (name) =>

                name !== CACHE_NAME

            )

            .map((name) =>

              caches.delete(name)

            )

        );

      })

  );

  self.clients.claim();

});

// ถ้ามีเน็ต ใช้ไฟล์จาก network

// และเก็บสำเนาไว้ใน cache

// ถ้าไม่มีเน็ต ใช้จาก cache

self.addEventListener("fetch", (event) => {

  if (

    event.request.method !== "GET"

  ) {

    return;

  }

  event.respondWith(

    fetch(event.request)

      .then((response) => {

        const responseClone =

          response.clone();

        caches

          .open(CACHE_NAME)

          .then((cache) => {

            cache.put(

              event.request,

              responseClone

            );

          });

        return response;

      })

      .catch(() => {

        return caches

          .match(event.request)

          .then((cachedResponse) => {

            if (cachedResponse) {

              return cachedResponse;

            }

            // ถ้าเป็นการเปิดหน้าเว็บ

            // ให้กลับไป index.html

            if (

              event.request.mode ===

              "navigate"

            ) {

              return caches.match(

                "/index.html"

              );

            }

            return Response.error();

          });

      })

  );

});
