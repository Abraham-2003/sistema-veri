import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router/index'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'

import { registerSW } from 'virtual:pwa-register'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)

app.use(router)
app.use(createPinia())
app.use(vuetify)
app.use(Viewer, {
  defaultOptions: {
    toolbar: true,
    navbar: false,
    title: false,
    movable: true,
    zoomable: true,
    scalable: true,
    fullscreen: true,
  },
})

/* -------- PWA UPDATE HANDLER -------- */
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-available'))
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline')
  },
})
window.__updateSW__ = updateSW
/* ------------------------------------ */

app.mount('#app')

/* -------- GOOGLE API INIT -------- */

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Variable global para saber si ya hay autorización
window.googleTokenReady = false;

async function initGoogleAPI() {
  if (!window.gapi || !window.google) {

    console.error(
      "Google scripts no cargaron"
    );

    return;
  }
  // Inicializar Google API Client
  gapi.load("client", async () => {

    try {

      await gapi.client.init({
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });

      await gapi.client.load("calendar", "v3");

      gapiInited = true;

      maybeEnable();

    } catch (err) {

      console.error("Error inicializando GAPI:", err);
    }
  });

  // Inicializar Google Identity Services
  tokenClient = google.accounts.oauth2.initTokenClient({

    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

    scope: "https://www.googleapis.com/auth/calendar.events",

    callback: (response) => {

      if (response.error) {

        console.error("Error autenticando:", response);

        return;
      }

      console.log("Google Calendar autorizado");

      window.googleTokenReady = true;
    },
  });

  gisInited = true;

  maybeEnable();
}

function maybeEnable() {

  if (gapiInited && gisInited) {

    console.log("Google API lista correctamente");
  }
}

window.googleLogin = async () => {

  // Esperar a que Google cargue
  let intentos = 0;

  while ((!window.google || !tokenClient) && intentos < 50) {

    await new Promise(resolve => setTimeout(resolve, 200));

    intentos++;
  }

  if (!window.google || !tokenClient) {

    console.error("Google API no terminó de cargar");

    return false;
  }

  return new Promise((resolve, reject) => {

    tokenClient.callback = async (response) => {

      if (response.error) {

        console.error(
          "Error autenticando:",
          response
        );

        reject(response);

        return;
      }

      gapi.client.setToken(response);

      console.log("Google Calendar autorizado");

      window.googleTokenReady = true;

      resolve(true);
    };

    tokenClient.requestAccessToken({
      prompt: "",
    });
  });
};
window.addEventListener("load", () => {

  console.log("Window cargada");

  initGoogleAPI();
});

/* ------------------------------------ */
/* ------------------------------------ */
