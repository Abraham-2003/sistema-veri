<template>
  <div class="admin-layout">
    <main class="admin-content">
      <h2 class="titulo">Bienvenido, {{ user.nombre || "Administrador" }}</h2>

      <!-- Estadísticas principales -->
      <div class="grid-stats">
        <div class="stat-card azul">
          <div class="stat-info">
            <h5>Verificentros Activos</h5>
            <p class="stat-value">{{ centrosActivos }}</p>
          </div>
          <div class="stat-icon">🏢</div>
        </div>

        <div class="stat-card verde">
          <div class="stat-info">
            <h5>Reportes Hoy</h5>
            <p class="stat-value">{{ reportesHoy }}</p>
          </div>
          <div class="stat-icon">📝</div>
        </div>

        <div class="stat-card rojo">
          <div class="stat-info">
            <h5>Solicitudes</h5>
            <p class="stat-value">{{ solicitudesActivas }}</p>
          </div>
          <div class="stat-icon">📩</div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <h3 class="subtitulo">Accesos Rápidos</h3>
      <div class="grid-accesos">
        <router-link to="/Administrador/Reportes" class="acceso-card azul-borde">
          📊 <span>Ir a Reportes</span>
        </router-link>

        <router-link to="/Administrador/Solicitudes" class="acceso-card amarillo-borde">
          📬 <span>Ver Solicitudes</span>
        </router-link>
      </div>
    </main>
  </div>

  <div>
    <h5 class="text-center mb-4 text-success">Desempeño por Verificentro</h5>

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

const user = ref(JSON.parse(localStorage.getItem("user")) || {});
const centrosActivos = ref(0);
const solicitudesActivas = ref(0);
const reportesHoy = ref(0);

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

onMounted(async () => {
  await obtenerCentrosActivos();
  await obtenerSolicitudesActivas();
  await obtenerReportesHoy();
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

async function cargarReportes() {
  const snapshot = await getDocs(collection(db, "reportes"));
  const agrupado = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const id = data.centroId;

    if (!agrupado[id]) {
      agrupado[id] = {
        reportes: 0,
        fallas: 0,
        gases: { Baja: [], Media: [], Cero: [] },
      };
    }

    agrupado[id].reportes++;

    // Fallas en líneas
    const lineas = data.lineas || {};
    Object.values(lineas).forEach((linea) => {
      if (["Apagada", "Fuera de servicio"].includes(linea.estado)) {
        agrupado[id].fallas++;
      }
    });

    // Gases en uso
    const gases = data.gases?.gasesUso || {};
    ["Baja", "Media", "Cero"].forEach((tipo) => {
      const registros = Array.isArray(gases[tipo]) ? gases[tipo] : [];
      registros.forEach((gas) => {
        agrupado[id].gases[tipo].push({
          psi: gas.psi,
          fecha: gas.fecha || doc.data().fecha || "", // usa fecha del gas o del reporte
        });
      });
    });
  });

  // Función para calcular consumo por ciclos
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

      if (psiActual > psiAnterior) {
        consumoTotal += psiInicial - psiAnterior;
        psiInicial = psiActual;
      }

      if (i === registros.length - 1) {
        consumoTotal += psiInicial - psiActual;
      }
    });

    return consumoTotal;
  }

  // Procesar métricas
  Object.entries(agrupado).forEach(([id, datos]) => {
    const consumoGases = {};

    Object.entries(datos.gases).forEach(([tipo, registros]) => {
      const ordenados = registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      consumoGases[tipo] = calcularConsumoPorCiclos(ordenados);
    });

    const diaActual = dayjs().date(); 
    const reportesEsperados = diaActual * 2;

    resumenPorCentro.value[id] = {
      ubicacion: centros.value[id]?.ubicacion || id,
      reportes: datos.reportes,
      cumplimiento: Math.round((datos.reportes / reportesEsperados) * 100),
      fallas: datos.fallas,
      consumoGases,
    };
  });
}


onMounted(async () => {
  await cargarCentros();
  await cargarReportes();
});
</script>
<style scoped>
/* Layout */
.admin-content {
  flex: 1;
  padding: 2rem;
}

/* Títulos */
.titulo {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.subtitulo {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: #34495e;
}

/* Grid de estadísticas */
.grid-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.stat-info h5 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.3rem;
  font-weight: 700;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

/* Colores */
.azul {
  background: linear-gradient(135deg, #007bff, #0056b3);
}
.verde {
  background: linear-gradient(135deg, #28a745, #1e7e34);
}
.rojo {
  background: linear-gradient(135deg, #dc3545, #a71d2a);
}

/* Accesos rápidos */
.grid-accesos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem;
}

.acceso-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

.acceso-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}

.azul-borde {
  border: 2px solid #007bff;
  color: #007bff;
}
.amarillo-borde {
  border: 2px solid #ffc107;
  color: #856404;
}
</style>
