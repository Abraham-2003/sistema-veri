<script setup>
import VacacionesCalendar from "../../components/vacaciones/VacacionesCalendar.vue";
import GenerarPlaneacion from "../../components/vacaciones/GenerarPlaneacion.vue";
</script>

<template>
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Planeación de Vacaciones</h2>

      <GenerarPlaneacion />
    </div>

    <VacacionesCalendar />
  </div>
</template>
