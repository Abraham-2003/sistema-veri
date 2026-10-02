<template>
  <div class="admin-layout">
    <main class="admin-content">
      <div class="dashboard-header">
        <div>
          <h2>Bienvenido, {{ user.nombre || "Administrador" }}</h2>
          <p class="text-muted">Resumen general del sistema y desempeño operativo.</p>
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
      <h3 class="subtitulo">Próximos eventos</h3>

      <div class="upcoming-card">
        <div class="upcoming-header">
          <span>Agenda próxima</span>
          <i class="bi bi-calendar-event"></i>
        </div>

        <div v-if="upcomingEvents.length === 0" class="empty-upcoming">
          No hay eventos próximos
        </div>

        <div v-else class="upcoming-list">
          <div v-for="e in upcomingEvents" :key="e.id" class="upcoming-item">
            <div class="date">
              {{ formatDate(e.date) }}
            </div>

            <div class="info">
              <strong>{{ e.title }}</strong>
              <span class="assigned"> 👤 {{ e.assignedToName || e.userName }} </span>
            </div>

            <span class="danger" :class="e.importance">
              {{ e.importance }}
            </span>
          </div>
        </div>
      </div>
      <h3 class="subtitulo">Arqueos diarios</h3>
      <div class="arqueos-config mb-3 d-flex gap-3 align-items-end">
        <div>
          <label>Cantidad de arqueos:</label>
          <input type="number" v-model="cantidadArqueos" min="1" class="form-control" />
        </div>
        <button class="btn btn-primary" @click="iniciarGeneracion">
          Generar arqueos
        </button>
      </div>
      <div class="row mb-3">

        <div class="col-md-3">
          <label class="form-label">
            Hora mínima
          </label>

          <input type="time" class="form-control" v-model="horaMinima" />
        </div>

        <div class="col-md-3">
          <label class="form-label">
            Hora máxima
          </label>

          <input type="time" class="form-control" v-model="horaMaxima" />
        </div>

      </div>
      <div v-if="arqueosGenerados.length > 0" class="arqueos-list mt-3">
        <h5>Arqueos generados</h5>

        <!-- Contenedor con scroll -->
        <div class="arqueos-scroll">
          <div v-for="(a, index) in arqueosGenerados" :key="index" class="arqueo-card">
            <div class="arqueo-header">
              <strong>Arqueo {{ a.arqueoNum }}</strong>
              <span class="badge bg-info">{{ a.centro }}</span>
            </div>
            <div class="arqueo-body">
              <span class="text-muted">Horario: {{ a.horario }}</span>
              <p class="mensaje">{{ a.mensaje }}</p>
            </div>
            <div class="arqueo-actions">
              <button class="btn btn-success btn-sm" @click="enviarWhatsApp(a.mensaje)">
                Enviar WhatsApp
              </button>
            </div>
          </div>
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
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../servivces/auth.js"; // ajusta según tu ruta
import { Bar, Line } from "vue-chartjs";
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
const events = ref([]);
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

async function cargarEventos() {
  try {
    const snapshot = await getDocs(collection(db, "events"));

    events.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Error eventos]", error);
    events.value = [];
  }
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
const upcomingEvents = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");

  return events.value
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
});
const formatDate = (date) => {
  return dayjs(date).format("DD MMM");
};
const centros = ref([]);
const resumenPorCentro = ref({});
const centroSeleccionado = ref("");

// filtros de fecha para la gráfica
const fechaInicio = ref(dayjs().startOf("month").format("YYYY-MM-DD"));
const fechaFin = ref(dayjs().endOf("day").format("YYYY-MM-DD"));

// datos para la gráfica
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

async function cargarCentros() {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(), // aquí debe venir "ubicacion"
  }));
}

// … funciones de consumo y resumen que ya tenías …

// nueva función para cargar reportes del centro seleccionado y graficar
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
const horaMinima = ref("09:30");
const horaMaxima = ref("19:00");
const cantidadArqueos = ref(1);

const arqueosGenerados = ref([]);
function horaAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}
const iniciarGeneracion = async () => {

  try {

    // Si NO hay token -> login
    if (!window.googleTokenReady) {


      const ok = await window.googleLogin();

      if (!ok) {

        console.error(
          "No se pudo autenticar Google"
        );

        return;
      }
    }

    await generarArqueos();

  } catch (err) {

    console.error(
      "Error iniciando generación:",
      err
    );
  }
};
function generarHoraAleatoria(minInicio, maxFin) {

  const randomMin =
    minInicio + Math.floor(Math.random() * (maxFin - minInicio));

  // Redondear a bloques de 15 min
  const bloque = Math.floor(randomMin / 15) * 15;

  const horaInicio = bloque;

  const horaFin = bloque + 15;

  const formato = (min) => {

    const h = Math.floor(min / 60);

    const m = min % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return {
    inicio: formato(horaInicio),
    fin: formato(horaFin),
    bloque,
  };
}

async function crearEventoArqueo(arqueo) {

  try {

    const fechaHoy = dayjs().format("YYYY-MM-DD");

    const inicio = arqueo.horario.split(" - ")[0];

    const fin = arqueo.horario.split(" - ")[1];

    const evento = {

      summary: `Arqueo - ${arqueo.centro}`,

      description: arqueo.mensaje,

      start: {
        dateTime: `${fechaHoy}T${inicio}:00`,
        timeZone: "America/Mexico_City",
      },

      end: {
        dateTime: `${fechaHoy}T${fin}:00`,
        timeZone: "America/Mexico_City",
      },

      reminders: {
        useDefault: false,
        overrides: [
          {
            method: "popup",
            minutes: 10,
          },
        ],
      },
    };


    const res =
      await gapi.client.calendar.events.insert({

        calendarId: "primary",

        resource: evento,
      });


  } catch (err) {

    console.error(
      "Error creando evento:",
      err
    );
  }
}

const generarArqueos = async () => {

  try {

    if (
      !Array.isArray(centros.value) ||
      centros.value.length === 0
    ) {

      alert("No hay centros registrados");

      return;
    }

    const minInicio = horaAMinutos(horaMinima.value);
    const maxFin = horaAMinutos(horaMaxima.value);
    if (maxFin <= minInicio) {
      alert("La hora máxima debe ser mayor que la mínima.");
      return;
    }

    const mensajes = [];

    for (const c of centros.value) {

      const horariosCentro = [];

      let intentos = 0;

      while (
        horariosCentro.length < cantidadArqueos.value &&
        intentos < 500
      ) {

        const nuevo = generarHoraAleatoria(
          minInicio,
          maxFin
        );

        intentos++;

        // 2 horas y media = 150 min
        const validoCentro =
          horariosCentro.every(
            (h) =>
              Math.abs(nuevo.bloque - h.bloque) >= 150
          );

        // YA NO VALIDAMOS CHOQUE ENTRE CENTROS

        if (validoCentro) {

          horariosCentro.push(nuevo);
        }
      }

      if (
        horariosCentro.length < cantidadArqueos.value
      ) {

        console.warn(
          `No se pudieron generar todos los arqueos para ${c.ubicacion}`
        );
      }

      horariosCentro.sort(
        (a, b) => a.bloque - b.bloque
      );

      for (const [idx, h] of horariosCentro.entries()) {

        const arqueo = {

          centro: c.ubicacion,

          horario: `${h.inicio} - ${h.fin}`,

          mensaje:
            `Buen día !!\n\n` +
            `Gerente, favor de realizar Arqueos a cajas disponibles ` +
            `de (${h.inicio} a ${h.fin}) por favor.\n` +
            `Centro: ${c.ubicacion}`,

          arqueoNum: idx + 1,
        };

        mensajes.push(arqueo);


        await crearEventoArqueo(arqueo);
      }
    }

    arqueosGenerados.value = mensajes;


  } catch (err) {

    console.error(
      "Error general generando arqueos:",
      err
    );
  }
};
// Enviar por WhatsApp
const enviarWhatsApp = (mensaje) => {
  const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
};

onMounted(async () => {
  await obtenerCentrosActivos();
  await obtenerSolicitudesActivas();
  await obtenerReportesHoy();
  await cargarInfraestructuraFueraServicio();

  await cargarCentros();
  await cargarReportesCentro(); // ojo aquí
  await cargarEventos();
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

/* ================= UPCOMING EVENTS ================= */
.upcoming-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.2rem;
  margin: 1.5rem 3%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.upcoming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #212529;
}

.upcoming-header i {
  font-size: 1.2rem;
  color: #0d6efd;
}

/* LISTA */
.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ITEM */
.upcoming-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.upcoming-item:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

/* FECHA */
.upcoming-item .date {
  font-size: 12px;
  font-weight: 600;
  color: #0d6efd;
  min-width: 70px;
}

/* INFO */
.upcoming-item .info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.upcoming-item .info strong {
  font-size: 13px;
}

.upcoming-item .assigned {
  font-size: 11px;
  color: #6c757d;
}

/* VACÍO */
.empty-upcoming {
  text-align: center;
  font-size: 13px;
  color: #6c757d;
  padding: 15px;
}

.arqueos-scroll {
  max-height: 300px;
  /* 👈 scroll interno */
  overflow-y: auto;
  padding-right: 8px;
}

.arqueo-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.arqueo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arqueo-body {
  margin-top: 6px;
}

.mensaje {
  white-space: pre-line;
  font-size: 0.9rem;
  margin: 6px 0;
}

.arqueo-actions {
  text-align: right;
}
</style>
