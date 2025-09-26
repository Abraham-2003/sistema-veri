<template>
  <div class="container py-4">
    <h3 class="mb-4">Histórico de Solicitudes</h3>

    <!-- Filtro por centro -->
    <select v-model="filtroCentro" class="form-select mb-3">
      <option value="">Todos los centros activos</option>
      <option v-for="centro in centros" :key="centro.id" :value="centro.id">
        {{ centro.ubicacion }}
      </option>
    </select>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Centro</th>
          <th>Tipo</th>
          <th>Elemento</th>
          <th>Proveedor o Laboratorio</th>
          <th>Fecha de Solicitud</th>
          <th>Fecha de Pago</th>
          <th>Fecha de Entrega</th>
          <th>Observaciones</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sol in solicitudesFiltradas" :key="sol.id">
          <td>{{ nombreCentro(sol.centroId) }}</td>
          <td>{{ sol.tipo }}</td>
          <td>{{ sol.elemento }}</td>
          <td>{{ sol.proveedor }}</td>
          <td>{{ sol.fechaSolicitud }}</td>
          <td>{{ sol.fechaPago }}</td>
          <td>{{ sol.fechaEntrega }}</td>
          <td>{{ sol.observaciones }}</td>
          <td
            class="badge"
            :class="sol.estatus === 'Pendiente' ? 'bg-warning' : 'bg-success'"
          >
            {{ sol.estatus }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <nav>
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li
          class="page-item"
          v-for="n in totalPaginas"
          :key="n"
          :class="{ active: paginaActual === n }"
        >
          <button class="page-link" @click="paginaActual = n">{{ n }}</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, query, where } from "firebase/firestore";

const centros = ref([]);
const solicitudes = ref([]);
const filtroCentro = ref("");
const paginaActual = ref(1);
const porPagina = 10;

const nombreCentro = (id) => {
  const centro = centros.value.find(c => c.id === id)
  return centro ? centro.ubicacion : 'Centro desconocido'
}


const cargarCentros = async () => {
  const snapshot = await getDocs(
    query(collection(db, "centros"), where("estatus", "==", "Activo"))
  );
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarSolicitudes = async () => {
  const snapshot = await getDocs(collection(db, "solicitudes"));
  solicitudes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
};

const diasEntre = (inicio, fin) => {
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? "-" : diff;
};

const solicitudesFiltradas = computed(() => {
  const filtradas = filtroCentro.value
    ? solicitudes.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudes.value;
  const inicio = (paginaActual.value - 1) * porPagina;
  return filtradas.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  const filtradas = filtroCentro.value
    ? solicitudes.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudes.value;
  return Math.ceil(filtradas.length / porPagina);
});

onMounted(() => {
  cargarCentros();
  cargarSolicitudes();
});
</script>
