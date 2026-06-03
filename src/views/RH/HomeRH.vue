<template>
  <div class="home-rh">
    <h3>Vacaciones próximas</h3>
    <ul>
      <li v-for="v in proximasVacaciones" :key="v.id">
        {{ nombreEmpleado(v.empleadoId) }} - {{ nombreCentro(v.centroId) }}
        ({{ formatoFecha(v.fechaInicio) }} al {{ formatoFecha(v.fechaFin) }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";


const vacaciones = ref([]);

const nombreEmpleado = (id) => "Empleado " + id; // placeholder
const nombreCentro = (id) => "Centro " + id;
const formatoFecha = (f) => new Date(f).toLocaleDateString();

const proximasVacaciones = computed(() => {
  const hoy = new Date();
  return vacaciones.value.filter(v => new Date(v.fechaInicio) > hoy).slice(0, 10);
});

</script>
