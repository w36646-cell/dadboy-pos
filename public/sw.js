const CACHE_PREFIX =

  "dadboy-pos-";

const CACHE_VERSION =

  "__DADBOY_CACHE_VERSION__";

const CACHE_NAME =

  `${CACHE_PREFIX}${CACHE_VERSION}`;

const APP_SCOPE =

  self.registration.scope;

const APP_PATH =

  new URL(

    APP_SCOPE

  ).pathname;

const INDEX_URL =

  new URL(

    "index.html",

    APP_SCOPE

  ).href;

const APP_SHELL = [

  APP_SCOPE,

  INDEX_URL,

];


/*

  ==========================

  INSTALL

  ==========================

*/

self.addEventListener(

  "install",

  (event) => {

    event.waitUntil(

      caches

        .open(

          CACHE_NAME

        )

        .then(

          (cache) =>

            cache.addAll(

              APP_SHELL

            )

        )

    );

    self.skipWaiting();

  }

);


/*

  ==========================

  ACTIVATE

  ลบ cache รุ่นเก่า

  ==========================

*/

self.addEventListener(

  "activate",

  (event) => {

    event.waitUntil(

      caches

        .keys()

        .then(

          (cacheNames) =>

            Promise.all(

              cacheNames

                .filter(

  (name) =>

    name.startsWith(

      CACHE_PREFIX

    ) &&

    name !==

      CACHE_NAME

)
 

                .map(

                  (name) =>

                    caches.delete(

                      name

                    )

                )

            )

        )

    );

    self.clients.claim();

  }

);


/*

  ==========================

  FETCH

  สำคัญมาก:

  Service Worker จะดูแลเฉพาะ

  ไฟล์ของ dadboy-pos เท่านั้น

  Supabase / API ภายนอก

  ปล่อยผ่านตรงไป Network

  ==========================

*/

self.addEventListener(

  "fetch",

  (event) => {

    const request =

      event.request;

    if (

      request.method !==

      "GET"

    ) {

      return;

    }

    const url =

      new URL(

        request.url

      );

    /*

      ห้าม Service Worker

      ยุ่งกับ Supabase

      หรือ API คนละ domain

    */

    if (

      url.origin !==

      self.location.origin

    ) {

      return;

    }

    /*

      ดูแลเฉพาะ /dadboy-pos/

    */

    if (

      !url.pathname.startsWith(

        APP_PATH

      )

    ) {

      return;

    }

    event.respondWith(

      (async () => {

        try {

          /*

            Network First

          */

          const response =

            await fetch(

              request

            );

          /*

            Cache เฉพาะ response

            ที่สำเร็จ

          */

          if (

            response &&

            response.ok

          ) {

            const cache =

              await caches.open(

                CACHE_NAME

              );

            await cache.put(

              request,

              response.clone()

            );

          }

          return response;

        } catch {

          /*

            Network ไม่ได้

            ค่อยใช้ Cache

          */

          const cached =

            await caches.match(

              request

            );

          if (cached) {

            return cached;

          }

          /*

            เปิดหน้าเว็บ Offline

            ให้กลับ index.html

          */

          if (

            request.mode ===

            "navigate"

          ) {

            const index =

              await caches.match(

                INDEX_URL

              );

            if (index) {

              return index;

            }

          }

          return Response.error();

        }

      })()

    );

  }

);
 
