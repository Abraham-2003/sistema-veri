import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'

const vuetify = createVuetify()

const app = createApp(App)

app.use(router)
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

app.mount('#app')
