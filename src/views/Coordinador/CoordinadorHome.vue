<template>
  <div class="admin-layout">
    <main class="admin-content">
      <div class="dashboard-header">
        <div>
          <h2>Bienvenido, {{ user.nombre || "Coordinador" }}</h2>
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
      <!-- CALENDARIO + PANEL -->
      <div class="row g-3">
        <!-- Calendario -->
        <div class="col-lg-9">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Calendario de Calibraciones</h5>

                <select v-model="centroSeleccionado" class="form-select" style="max-width: 320px">
                  <option value="">Todos los centros</option>

                  <option v-for="(centro, id) in centros" :key="id" :value="id">
                    {{ centro.ubicacion }}
                  </option>
                </select>
              </div>
            </div>

            <div class="card-body">
              <VueCal locale="es" :events="eventosFiltrados" default-view="month" active-view="month"
                :disable-views="['years', 'week', 'day']" events-on-month-view="short" @cell-click="seleccionarFecha"
                style="height: 700px" />
            </div>
          </div>
        </div>

        <!-- Panel lateral -->
        <div class="col-lg-3">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header">
              <strong>
                {{ fechaSeleccionada || "Seleccione un día" }}
              </strong>
            </div>

            <div class="card-body" style="max-height: 700px; overflow-y: auto">
              <div v-if="!eventosSeleccionados.length" class="text-center text-muted mt-4">
                No hay eventos seleccionados.
              </div>

              <div v-for="evento in eventosSeleccionados" :key="evento.folio" class="border rounded p-3 mb-3">
                <div class="fw-bold">
                  {{ evento.centro }}
                </div>

                <div class="small text-muted mb-2">
                  {{ evento.tipo }}
                </div>

                <div class="mb-2">
                  <strong>Subtipo:</strong>
                  {{ evento.subtipo || "-" }}
                </div>

                <div class="mb-2">
                  <strong>Folio:</strong>
                  {{ evento.folio }}
                </div>

                <div>
                  <strong>Vence:</strong>
                  {{ evento.vencimiento }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA -->
      <h3 class="subtitulo mt-4">Próximos Vencimientos</h3>

      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Centro</th>
                <th>Tipo</th>
                <th>Subtipo</th>
                <th>Vencimiento</th>
                <th>Días</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in proximosVencimientos" :key="`${item.centro}-${item.fecha}`">
                <td>{{ item.centro }}</td>
                <td>{{ item.tipo }}</td>
                <td>{{ item.subtipo }}</td>
                <td>{{ item.fecha }}</td>

                <td>
                  <span class="badge" :class="item.dias <= 30
                      ? 'bg-danger'
                      : item.dias <= 60
                        ? 'bg-warning text-dark'
                        : 'bg-success'
                    ">
                    {{ item.dias }} días
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>
      <div >
        <h4 class="section-title">Desempeño por Verificentro</h4>

        <!-- Selector de centro -->
        <select v-model="centroSeleccionado" class="form-select mb-4">
          <option disabled value="">Selecciona un centro</option>

          <option v-for="centro in centros" :key="centro.id" :value="centro.id">
            {{ centro.ubicacion }}
          </option>
        </select>

        <!-- Filtros de fecha -->
        <div v-if="centroSeleccionado" class="mb-3 d-flex gap-3">
          <div>
            <label>Fecha inicio:</label>
            <input type="date" v-model="fechaInicio" />
          </div>
          <div>
            <label>Fecha fin:</label>
            <input type="date" v-model="fechaFin" />
          </div>
          <button class="btn btn-primary" @click="cargarReportesCentro">Filtrar</button>
        </div>

        <!-- Gráfica de líneas -->
        <div v-if="chartData" style="width: 100%; max-width: 800px; height: 400px">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../servivces/auth.js"; // ajusta según tu ruta

import { Bar, Line } from "vue-chartjs";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

dayjs.extend(isSameOrBefore);
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const user = ref(JSON.parse(localStorage.getItem("user")) || {});
const centrosActivos = ref(0);
const solicitudesActivas = ref(0);
const reportesHoy = ref(0);
const infraestructuraFueraServicio = ref(0);
const inicioMes = dayjs().startOf("month");
const hoy = dayjs().endOf("day");
const fechaInicio = ref(dayjs().startOf("month").format("YYYY-MM-DD"));
const fechaFin = ref(dayjs().endOf("day").format("YYYY-MM-DD"));
const chartData = ref(null);
const chartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Lecturas de gases por día",
    },
  },
};

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
const eventosCalibraciones = ref([]);
const proximosVencimientos = ref([]);
const calibracionSeleccionada = ref(null);
const eventosSeleccionados = ref([]);
const fechaSeleccionada = ref(null);

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
async function cargarCalibraciones() {
  const snapshot = await getDocs(collection(db, "ReporteLab"));

  const eventos = [];
  const proximos = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (!data.vencimiento) return;

    const fecha = dayjs(data.vencimiento);

    const nombreCentro = centros.value[data.centroId]?.ubicacion || "Sin centro";

    const dias = fecha.diff(dayjs(), "day");

    if (dias >= 0) {
      proximos.push({
        centro: nombreCentro,
        tipo: data.tipo,
        subtipo: data.subtipo,
        fecha: fecha.format("DD/MM/YYYY"),
        dias,
      });
    }
    const inicio = fecha.hour(10).minute(0).second(0);
    const fin = fecha.hour(11).minute(0).second(0);

    eventos.push({
      start: inicio.toDate(),
      end: fin.toDate(),

      title: `${data.tipo}`,
      centroId: data.centroId,
      centro: nombreCentro,
      tipo: data.tipo,
      subtipo: data.subtipo,
      folio: data.folio,
      vencimiento: data.vencimiento,

      class: obtenerClaseEvento(fecha),
    });
  });
  eventosCalibraciones.value = eventos;
  console.log(eventos[0]);

  proximosVencimientos.value = proximos.sort((a, b) => a.dias - b.dias).slice(0, 10);
}

function seleccionarFecha(fecha) {
  console.log("CLICK DIA", fecha);

  fechaSeleccionada.value = dayjs(fecha).format("DD/MM/YYYY");

  eventosSeleccionados.value = eventosFiltrados.value.filter((evento) =>
    dayjs(evento.start).isSame(dayjs(fecha), "day")
  );
}
function eventoClick(evento) {
  calibracionSeleccionada.value = evento;
}
function obtenerClaseEvento(fecha) {
  const dias = dayjs(fecha).diff(dayjs(), "day");

  if (dias <= 30) return "evento-critico";

  if (dias <= 60) return "evento-alerta";

  return "evento-normal";
}
const eventosFiltrados = computed(() => {
  if (!centroSeleccionado.value) return eventosCalibraciones.value;

  return eventosCalibraciones.value.filter(
    (e) => e.centroId === centroSeleccionado.value
  );
});

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
async function cargarReportesCentro() {
  if (!centroSeleccionado.value) return;

  const inicio = dayjs(fechaInicio.value);
  const fin = dayjs(fechaFin.value);

  const q = query(
    collection(db, "reportes"),
    where("centroId", "==", centroSeleccionado.value)
  );

  const snapshot = await getDocs(q);



  snapshot.docs.forEach(doc => {
  });
  const datos = snapshot.docs.map((doc) => doc.data());


  const filtrados = datos.filter((r) => {
    const fecha = dayjs(r.fecha);
    return fecha.isSameOrAfter(inicio, "day") &&
      fecha.isSameOrBefore(fin, "day");
  });


  const registros = [];
  filtrados.forEach((r) => {
    const gasesUso = r.gases?.uso || {};
    ["Baja", "Media", "Cero"].forEach((tipo) => {
      const arr = Array.isArray(gasesUso[tipo]) ? gasesUso[tipo] : [];
      arr.forEach((gas) => {
        registros.push({
          tipo,
          psi: gas.psi,
          fecha: gas.fecha || r.fecha,
        });
      });
    });
  });

  const labels = [
    ...new Set(registros.map((r) => dayjs(r.fecha).format("YYYY-MM-DD"))),
  ].sort();


  const series = {
    Baja: labels.map((f) => {
      const match = registros.find(
        (r) => r.tipo === "Baja" && dayjs(r.fecha).format("YYYY-MM-DD") === f
      );
      return match ? match.psi : null;
    }),
    Media: labels.map((f) => {
      const match = registros.find(
        (r) => r.tipo === "Media" && dayjs(r.fecha).format("YYYY-MM-DD") === f
      );
      return match ? match.psi : null;
    }),
    Cero: labels.map((f) => {
      const match = registros.find(
        (r) => r.tipo === "Cero" && dayjs(r.fecha).format("YYYY-MM-DD") === f
      );
      return match ? match.psi : null;
    }),
  };

  chartData.value = {
    labels,
    datasets: [
      {
        label: "Gas Baja",
        data: series.Baja,
        borderColor: "#28a745",
        backgroundColor: "#28a745",
        tension: 0.3,
      },
      {
        label: "Gas Media",
        data: series.Media,
        borderColor: "#007bff",
        backgroundColor: "#007bff",
        tension: 0.3,
      },
      {
        label: "Gas Cero",
        data: series.Cero,
        borderColor: "#dc3545",
        backgroundColor: "#dc3545",
        tension: 0.3,
      },
    ],
  };
}

onMounted(async () => {
  await cargarCentros();
  await cargarReportes();
  await cargarSolicitudes();
  await cargarCalibraciones();
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
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
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

.vuecal__event.evento-calibracion {
  background: #dc3545 !important;
  color: #fff !important;
  border-radius: 6px;
}

:deep(.vuecal__cell--has-events) {
  background-color: #fff3cd !important;
  cursor: pointer;
}

:deep(.evento-critico) {
  background: #dc3545 !important;
  color: white !important;
}

:deep(.evento-alerta) {
  background: #ffc107 !important;
  color: #000 !important;
}

:deep(.evento-normal) {
  background: #198754 !important;
  color: white !important;
}

:deep(.vuecal__event) {
  display: none !important;
}
</style>
