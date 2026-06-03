<template>
  <v-app>
    <!-- Modal bloqueante de actualización -->
    <v-dialog v-model="updateAvailable" persistent fullscreen>
      <v-card class="d-flex flex-column align-center justify-center pa-8">
        <v-card-title class="text-h4 font-weight-bold mb-4">
          Nueva versión disponible
        </v-card-title>
        <v-card-text class="text-center mb-6">
          <p style="font-size:1.2rem; margin-bottom:1rem;">
            Se detectaron cambios importantes en la aplicación.
          </p>
          <p style="font-size:1rem; color:#555;">
            Para continuar, es necesario actualizar el cache.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" large @click="refreshApp">
            Actualizar ahora
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Resto de la app -->
    <AlertBox ref="alertRef" />
    <router-view />
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AlertBox from './components/AlertBox.vue'

const alertRef = ref(null)
const updateAvailable = ref(false)

let updateListener = null

function refreshApp() {
  if (window.__updateSW__) {
    window.__updateSW__(true)
  } else {
    // fallback: recarga forzada
    window.location.reload(true)
  }
}

onMounted(() => {
  updateListener = () => {
    updateAvailable.value = true
  }
  window.addEventListener('pwa-update-available', updateListener)
})

onBeforeUnmount(() => {
  if (updateListener) {
    window.removeEventListener('pwa-update-available', updateListener)
  }
})
</script>
