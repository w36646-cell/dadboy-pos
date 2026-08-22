import {

  createRoot,

} from "react-dom/client";

import App from "./App.jsx";

import "./styles/App.css";


createRoot(

  document.getElementById(

    "root"

  )

).render(
<App />

);


/*

  ==========================

  SERVICE WORKER

  GitHub Pages ของเราอยู่ที่

  /dadboy-pos/

  ไม่ใช่ /

  ดังนั้น sw.js ต้องอยู่ใต้

  /dadboy-pos/sw.js

  ==========================

*/

if (

  "serviceWorker" in

  navigator

) {

  window.addEventListener(

    "load",

    async () => {

      try {

        const baseUrl =

          import.meta.env

            .BASE_URL;

        const desiredScope =

          new URL(

            baseUrl,

            window.location

              .origin

          ).href;

        const desiredScript =

          new URL(

            `${baseUrl}sw.js`,

            window.location

              .origin

          ).href;

        /*

          =====================

          ลบ Service Worker เก่า

          โดยเฉพาะตัวเก่าที่เคย

          register เป็น /sw.js

          =====================

        */

        const registrations =

          await navigator

            .serviceWorker

            .getRegistrations();

        let removedOldWorker =

          false;

        for (

          const registration of

          registrations

        ) {

          const scriptUrl =

            registration

              .active

              ?.scriptURL ||

            registration

              .waiting

              ?.scriptURL ||

            registration

              .installing

              ?.scriptURL ||

            "";

          const isCorrect =

            registration.scope ===

              desiredScope &&

            (

              !scriptUrl ||

              scriptUrl ===

                desiredScript

            );

          if (!isCorrect) {

            await registration

              .unregister();

            removedOldWorker =

              true;

          }

        }

        /*

          =====================

          Register ตัวที่ถูกต้อง

          =====================

        */

        const registration =

          await navigator

            .serviceWorker

            .register(

              `${baseUrl}sw.js`,

              {

                scope:

                  baseUrl,

              }

            );

        await registration.update();

        console.log(

          "Service Worker registered:",

          registration.scope

        );

        /*

          ถ้ามี Worker เก่าถูกลบ

          Reload เพียงครั้งเดียว

          เพื่อให้ตัวใหม่เข้าควบคุม

        */

        if (

          removedOldWorker &&

          sessionStorage.getItem(

            "dadboy_sw_cleanup"

          ) !== "done"

        ) {

          sessionStorage.setItem(

            "dadboy_sw_cleanup",

            "done"

          );

          window.location.reload();

          return;

        }

        sessionStorage.removeItem(

          "dadboy_sw_cleanup"

        );

      } catch (error) {

        console.error(

          "Service Worker setup failed:",

          error

        );

      }

    }

  );

}
 
