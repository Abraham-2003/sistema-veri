<template>
  <div class="container py-4">
    <h3 class="mb-4">Reportes por Centro</h3>

    <div class="row">
      <div v-for="centro in centros" :key="centro.id" class="col-md-4 mb-3">
        <div
          class="card h-100 centro-card"
          :class="centro.estatus === 'Activo' ? 'activo' : 'desactivado'"
          @click="verReporte(centro.ubicacion)"
        >
          <div class="card-body">
            <h5 class="card-title">{{ centro.ubicacion }}</h5>
            <p class="card-text">Responsable: {{ nombreEncargado(centro.encargado) }}</p>
          </div>
          <div
            v-if="tieneReporteHoy(centro.id)"
            class="bg-warning text-dark text-center fw-bold py-1"
          >
            Reporte pendiente
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

const reportesHoy = ref([]);

const cargarReportesHoy = async () => {
  const hoy = dayjs().format("YYYY-MM-DD");
  const snapshot = await getDocs(collection(db, "reportes"));
  reportesHoy.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((r) => r.fecha === hoy);
};

const centros = ref([]);
const router = useRouter();

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
const tieneReporteHoy = (centroId) => {
  return reportesHoy.value.some((r) => r.centroId === centroId);
};

const gerentes = ref([]);

const cargarGerentes = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));
  gerentes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((u) => u.rol === "Gerente");
};
const nombreEncargado = (id) => {
  const gerente = gerentes.value.find((g) => g.id === id);
  return gerente ? gerente.nombre : "Sin asignar";
};

const verReporte = (ubicacionCentro) => {
  router.push({ name: "ReporteVeri", params: { ubicacion: ubicacionCentro } });
};

onMounted(() => {
  cargarCentros();
  cargarGerentes();
  cargarReportesHoy();
});
</script>

<style>
.centro-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.centro-card.activo {
  border-color: #198754; /* verde */
}

.centro-card.desactivado {
  border-color: #dc3545; /* rojo */
  opacity: 0.9;
}

.centro-card:hover {
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  border-width: 3px;
}
.bg-warning {
  border-bottom: 2px solid #ffc107;
}
</style>
