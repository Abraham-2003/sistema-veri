<template>
  <div class="admin-layout">
    <main class="admin-content">
      <div class="dashboard-header">
        <div>
          <h2>Bienvenido, {{ user.nombre || "Administrador" }}</h2>
          <p class="text-muted">Resumen general del sistema y desempeño operativo</p>
        </div>
      </div>

      <!-- Estadísticas principales -->
      <div class="grid-stats">
        <div class="stat-card primary">
          <div>
            <span class="stat-label">Verificentros Activos</span>
            <h3>{{ centrosActivos }}</h3>
          </div>
          <i class="bi bi-building stat-icon"></i>
        </div>

        <div class="stat-card success">
          <div>
            <span class="stat-label">Reportes Hoy</span>
            <h3>{{ reportesHoy }}</h3>
          </div>
          <i class="bi bi-file-earmark-text stat-icon"></i>
        </div>

        <div class="stat-card warning">
          <div>
            <span class="stat-label">Solicitudes</span>
            <h3>{{ solicitudesActivas }}</h3>
          </div>
          <i class="bi bi-inbox stat-icon"></i>
        </div>

        <div class="stat-card danger">
          <div>
            <span class="stat-label">Infraestructura fuera de servicio</span>
            <h3>{{ infraestructuraFueraServicio }}</h3>
          </div>
          <i class="bi bi-exclamation-triangle stat-icon"></i>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <h3 class="subtitulo">Accesos Rápidos</h3>
      <div class="quick-actions">
        <router-link to="/Administrador/Reportes" class="quick-card">
          <i class="bi bi-bar-chart"></i>
          <span>Reportes</span>
        </router-link>

        <router-link to="/Administrador/Solicitudes" class="quick-card">
          <i class="bi bi-envelope"></i>
          <span>Solicitudes</span>
        </router-link>
      </div>
    </main>
  </div>

  <div>
    <h4 class="section-title">Desempeño por Verificentro</h4>

    <select v-model="centroSeleccionado" class="form-select mb-4">
      <option disabled value="">Selecciona un centro</option>
      <option v-for="(centro, id) in centros" :key="id" :value="id">
        {{ centro.ubicacion }}
      </option>
    </select>

    <div v-if="centroSeleccionado" class="d-flex flex-wrap justify-content-center gap-4">
      <!-- Tarjeta 1: Indicadores principales -->
      <div
        class="card shadow-sm border border-secondary-subtle"
        style="width: 400px; height: 280px"
      >
        <div class="card-body">
          <Bar
            :data="{
              labels: ['Reportes', 'Cumplimiento (%)', 'Fallas'],
              datasets: [
                {
                  label: resumenPorCentro[centroSeleccionado].ubicacion,
                  data: [
                    resumenPorCentro[centroSeleccionado].reportes,
                    resumenPorCentro[centroSeleccionado].cumplimiento,
                    resumenPorCentro[centroSeleccionado].fallas,
                  ],
                  backgroundColor: ['#198754', '#0d6efd', '#dc3545'],
                },
              ],
            }"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Indicadores principales' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }"
          />
        </div>
      </div>

      <!-- Tarjeta 2: Consumo de gases -->
      <div
        class="card shadow-sm border border-secondary-subtle"
        style="width: 400px; height: 280px"
      >
        <div class="card-body">
          <Bar
            :data="{
              labels: Object.keys(resumenPorCentro[centroSeleccionado].consumoGases),
              datasets: [
                {
                  label: 'Consumo de gases (PSI)',
                  data: Object.values(resumenPorCentro[centroSeleccionado].consumoGases),
                  backgroundColor: ['#ffc107', '#20c997', '#6f42c1'],
                },
              ],
            }"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Consumo de gases en uso' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }"
          />
        </div>
      </div>
      <div
        class="card shadow-sm border border-secondary-subtle"
        style="width: 400px; height: 280px"
      >
        <div class="card-body">
          <Bar
            :data="{
              labels: ['Pendientes', 'Finalizadas'],
              datasets: [
                {
                  label: 'Solicitudes',
                  data: [
                    solicitudesPorCentro[centroSeleccionado]?.Pendiente || 0,
                    solicitudesPorCentro[centroSeleccionado]?.Finalizado || 0,
                  ],
                  backgroundColor: ['#ffc107', '#198754', '#dc3545'],
                },
              ],
            }"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Solicitudes por estatus' },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../servivces/auth.js"; // ajusta según tu ruta
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

const user = ref(JSON.parse(localStorage.getItem("user")) || {});
const centrosActivos = ref(0);
const solicitudesActivas = ref(0);
const reportesHoy = ref(0);
const infraestructuraFueraServicio = ref(0);
const inicioMes = dayjs().startOf("month");
const hoy = dayjs().endOf("day");

async function obtenerReportesHoy() {
  const inicioDia = dayjs().startOf("day").toISOString();
  const finDia = dayjs().endOf("day").toISOString();

  const q = query(
    collection(db, "reportes"),
    where("fecha", ">=", inicioDia),
    where("fecha", "<=", finDia)
  );

  const snapshot = await getDocs(q);
  reportesHoy.value = snapshot.size;
}

async function obtenerCentrosActivos() {
  const q = query(collection(db, "centros"), where("estatus", "==", "Activo"));
  const snapshot = await getDocs(q);
  centrosActivos.value = snapshot.size;
}

async function obtenerSolicitudesActivas() {
  const q = query(collection(db, "solicitudes"), where("estatus", "==", "Pendiente"));
  const snapshot = await getDocs(q);
  solicitudesActivas.value = snapshot.size;
}
const cargarInfraestructuraFueraServicio = async () => {
  try {
    const snapshot = await getDocs(collection(db, "infraestructura"));

    infraestructuraFueraServicio.value = snapshot.docs.filter(
      (doc) => doc.data().estatus === "Fuera de servicio"
    ).length;
  } catch (error) {
    console.error("[Error al cargar infraestructura]", error);
    infraestructuraFueraServicio.value = 0;
  }
};

onMounted(async () => {
  await obtenerCentrosActivos();
  await obtenerSolicitudesActivas();
  await obtenerReportesHoy();
  cargarInfraestructuraFueraServicio();
});

const centros = ref({});
const resumenPorCentro = ref({});
const centroSeleccionado = ref("");

async function cargarCentros() {
  const snapshot = await getDocs(collection(db, "centros"));
  snapshot.forEach((doc) => {
    centros.value[doc.id] = doc.data();
  });
}
function contarDiasHabiles(inicio, fin) {
  let dias = 0;
  let fecha = inicio.clone();

  while (fecha.isSameOrBefore(fin, "day")) {
    if (fecha.day() !== 0) {
      // 0 = domingo
      dias++;
    }
    fecha = fecha.add(1, "day");
  }

  return dias;
}

function calcularConsumoPorCiclos(registros) {
  let consumoTotal = 0;
  let psiInicial = null;

  registros.forEach((registro, i) => {
    const psiActual = registro.psi;

    if (psiInicial === null) {
      psiInicial = psiActual;
      return;
    }

    const psiAnterior = registros[i - 1].psi;

    // Cuando se cambia el tanque (sube el PSI)
    if (psiActual > psiAnterior) {
      consumoTotal += psiInicial - psiAnterior;
      psiInicial = psiActual;
    }

    // Último registro
    if (i === registros.length - 1) {
      consumoTotal += psiInicial - psiActual;
    }
  });

  return consumoTotal;
}
async function cargarReportes() {
  const snapshot = await getDocs(collection(db, "reportes"));
  const agrupado = {};

  const inicioMes = dayjs().startOf("month");
  const hoy = dayjs().endOf("day");

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const centroId = data.centroId;

    if (!data.fecha) return;

    const fechaReporte = dayjs(data.fecha);

    if (fechaReporte.isBefore(inicioMes) || fechaReporte.isAfter(hoy)) {
      return;
    }

    if (!agrupado[centroId]) {
      agrupado[centroId] = {
        reportes: 0,
        fallas: 0,
        gases: { Baja: [], Media: [], Cero: [] },
      };
    }

    agrupado[centroId].reportes++;

    const lineas = data.lineas || {};
    Object.values(lineas).forEach((linea) => {
      if (["Apagada", "Fuera de servicio"].includes(linea.estado)) {
        agrupado[centroId].fallas++;
      }
    });
    const gasesUso = data.gases?.uso || {};
    ["Baja", "Media", "Cero"].forEach((tipo) => {
      const registros = Array.isArray(gasesUso[tipo]) ? gasesUso[tipo] : [];

      registros.forEach((gas) => {
        agrupado[centroId].gases[tipo].push({
          psi: gas.psi,
          fecha: gas.fecha || data.fecha,
        });
      });
    });
  });

  Object.entries(agrupado).forEach(([centroId, datos]) => {
    const consumoGases = {};

    Object.entries(datos.gases).forEach(([tipo, registros]) => {
      const ordenados = registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      consumoGases[tipo] = calcularConsumoPorCiclos(ordenados);
    });

    const inicioMes = dayjs().startOf("month");
    const hoy = dayjs();

    const diasHabiles = contarDiasHabiles(inicioMes, hoy);
    const reportesEsperados = diasHabiles * 2;

    resumenPorCentro.value[centroId] = {
      ubicacion: centros.value?.[centroId]?.ubicacion ?? centroId,
      reportes: datos.reportes,
      cumplimiento: Math.round((datos.reportes / reportesEsperados) * 100),
      fallas: datos.fallas,
      consumoGases,
    };
  });
}

const solicitudesPorCentro = ref({});

async function cargarSolicitudes() {
  const snapshot = await getDocs(collection(db, "solicitudes"));
  const agrupado = {};

  snapshot.forEach((doc) => {
    const s = doc.data();
    const id = s.centroId;

    if (!agrupado[id]) {
      agrupado[id] = {
        Pendiente: 0,
        Finalizado: 0,
      };
    }

    agrupado[id][s.estatus] = (agrupado[id][s.estatus] || 0) + 1;
  });

  solicitudesPorCentro.value = agrupado;
}

onMounted(async () => {
  await cargarCentros();
  await cargarReportes();
  await cargarSolicitudes();
});
</script>
<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.grid-stats {
  display: grid;
  margin: 3%;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border-top: 4px solid transparent;
}

.stat-card h3 {
  margin: 0;
  font-size: 2rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.stat-icon {
  font-size: 2.2rem;
  opacity: 0.3;
}

/* Colores */
.stat-card.primary {
  border-top-color: #0d6efd;
}
.stat-card.success {
  border-top-color: #198754;
}
.stat-card.warning {
  border-top-color: #ffc107;
}
.stat-card.danger {
  border-top-color: #dc3545;
}
.quick-actions {
  display: grid;
  margin: 3%;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-card {
  background: #fff;
  padding: 1.2rem;
  border-radius: 10px;
  text-align: center;
  text-decoration: none;
  color: #212529;
  box-shadow: 0 4px 14px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.quick-card i {
  font-size: 1.8rem;
  color: #0d6efd;
  margin-bottom: 0.5rem;
  display: block;
}
/* Título de sección */
.section-title {
  font-weight: 600;
  color: #212529;
  margin-bottom: 1rem;
  letter-spacing: 0.3px;
}

/* Select */
.form-select {
  max-width: 420px;
  border-radius: 8px;
  box-shadow: none;
}

/* Contenedor de tarjetas */
.d-flex.flex-wrap.justify-content-center.gap-4 {
  margin-top: 1rem;
}

/* Tarjetas de gráficas */
.card {
  border-radius: 14px;
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

/* Cuerpo de la tarjeta */
.card-body {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}

/* Ajuste fino para Chart.js */
.card canvas {
  max-height: 220px !important;
}

/* Borde sutil corporativo */
.border-secondary-subtle {
  border-color: #e9ecef !important;
}

</style>
