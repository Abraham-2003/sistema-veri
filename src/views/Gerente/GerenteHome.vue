<template>
  <div class="home-gerente px-3 py-4 text-white text-center">
    <h4 class="mb-4 fw-bold">Bienvenido, {{ user.nombre }}</h4>

    <div class="d-flex flex-column gap-3">
      <!-- Card: Reportes -->
      <router-link to="/Gerente/Reporte" class="card shadow-sm text-decoration-none">
        <img src="../../assets/Reportes.webp" class="card-img-top" alt="Reportes" />
        <div class="card-body bg-dark bg-opacity-75 text-white">
          <h5 class="card-title">📊 Enviar Reporte Diario</h5>
          <p class="card-text small">Registra el estado de tu verificentro</p>
        </div>
      </router-link>

      <!-- Card: Solicitudes -->
      <router-link to="/Gerente/Solicitudes" class="card shadow-sm text-decoration-none">
        <img src="../../assets/solicitudes.jpg" class="card-img-top" alt="Solicitudes" />
        <div class="card-body bg-dark bg-opacity-75 text-white">
          <h5 class="card-title">📨 Registrar Solicitud</h5>
          <p class="card-text small">Solicita soporte o mantenimiento</p>
        </div>
      </router-link>

      <!-- Card: Infraestructura -->
      <router-link to="/Gerente/Infraestructura" class="card shadow-sm text-decoration-none">
        <img src="../../assets/Infraestructura.jpg" class="card-img-top" alt="Infraestructura" />
        <div class="card-body bg-dark bg-opacity-75 text-white">
          <h5 class="card-title">🏗️ Infraestructura</h5>
          <p class="card-text small">Actualiza el estado de tus equipos</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const user = ref({ nombre: 'Gerente' })

onMounted(() => {
  const stored = JSON.parse(localStorage.getItem('user'))
  if (stored) user.value = stored
})
</script>

<style scoped>

.card {
  border-radius: 12px;
  overflow: hidden;
}

.card-img-top {
  height: 160px;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
}
</style>
