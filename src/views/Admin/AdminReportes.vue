<template>
  <div class="container py-4">
    <h2 class="titulo">Reportes por Centro</h2>

    <div class="grid-centros">
      <div
        v-for="centro in centros"
        :key="centro.id"
        class="centro-card"
        :class="centro.estatus === 'Activo' ? 'activo' : 'desactivado'"
        @click="verReporte(centro.ubicacion)"
      >
        <div class="centro-header">
          <h3>{{ centro.ubicacion }}</h3>
          <span
            class="badge"
            :class="centro.estatus === 'Activo' ? 'badge-verde' : 'badge-rojo'"
          >
            {{ centro.estatus }}
          </span>
        </div>

        <p class="encargado">
          Responsable:
          <span class="nombre">{{ nombreEncargado(centro.encargado) }}</span>
        </p>

        <div v-if="tieneReporteHoy(centro.id)" class="alerta-pendiente">
          Reporte pendiente
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

<style scoped>
/* Layout general */
.titulo {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.grid-centros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

/* Cards */
.centro-card {
  background: #fff;
  border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.centro-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.centro-card.activo {
  border-color: #28a745;
}

.centro-card.desactivado {
  border-color: #dc3545;
  opacity: 0.9;
}

/* Encabezado */
.centro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.centro-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}

/* Badge */
.badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-verde {
  background: #d4edda;
  color: #155724;
}

.badge-rojo {
  background: #f8d7da;
  color: #721c24;
}

/* Encargado */
.encargado {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0.8rem 0;
}

.nombre {
  font-weight: 600;
  color: #2c3e50;
}

/* Reporte pendiente */
.alerta-pendiente {
  background: #fff3cd;
  color: #856404;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  margin-top: auto;
}
</style>
