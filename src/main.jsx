import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import "./styles/App.css";

createRoot(document.getElementById("root")).render(
<App />

);

// Register Service Worker สำหรับ Offline/PWA

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker

      .register("/sw.js")

      .then((registration) => {

        console.log(

          "Service Worker registered:",

          registration.scope

        );

      })

      .catch((error) => {

        console.error(

          "Service Worker registration failed:",

          error

        );

      });

  });

}
 