<template>
  <div class="container py-3">
    <h5 class="text-center text-success mb-4">Reportes de Laboratorio</h5>

    <!-- Botón para abrir el modal -->

    <div class="modal fade" id="modalLab" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <form class="modal-content" @submit.prevent="guardarReporteLab">
          <div class="modal-header">
            <h5 class="modal-title">Agregar reporte de laboratorio</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <!-- Tipo principal -->
            <label class="form-label small text-muted">Tipo</label>
            <select v-model="nuevo.tipo" class="form-select mb-3" required>
              <option disabled value="">Selecciona un tipo</option>
              <option
                v-for="(config, nombre) in calibraciones"
                :key="nombre"
                :value="nombre"
              >
                {{ nombre }}
              </option>
            </select>

            <!-- Subtipo -->
            <div
              v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.subtipos?.length"
              class="mb-3"
            >
              <label class="form-label small text-muted">Subtipo</label>
              <select v-model="nuevo.subtipo" class="form-select" required>
                <option disabled value="">Selecciona una opción</option>
                <option
                  v-for="sub in calibraciones[nuevo.tipo].subtipos"
                  :key="sub"
                  :value="sub"
                >
                  {{ sub }}
                </option>
              </select>
            </div>

            <!-- Selección de línea -->
            <!-- Selección de línea si aplica a todas las líneas -->
            <div
              v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.aplica === 'todasLineas'"
              class="mb-3"
            >
              <label class="form-label small text-muted">Selecciona línea</label>
              <select v-model="nuevo.linea" class="form-select" required>
                <option disabled value="">Selecciona una línea</option>
                <option v-for="n in parseInt(centro?.lineas || 0)" :key="n" :value="n">
                  Línea {{ n }}
                </option>
              </select>
            </div>

            <!-- Línea dual -->
            <div
              v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.aplica === 'lineaDual'"
              class="alert alert-warning"
            >
              <strong>Este reporte aplica únicamente a la línea dual:</strong>
              Línea {{ centro?.lineaDual }}
            </div>

            <!-- Campos generales -->
            <label class="form-label small text-muted">Folio</label>
            <input v-model="nuevo.folio" class="form-control mb-2" required />

            <label class="form-label small text-muted">Fecha de calibración</label>
            <input
              v-model="nuevo.dictamen"
              type="date"
              class="form-control mb-3"
              required
            />

            <label class="form-label small text-muted">Fecha de vencimiento</label>
            <input
              v-model="nuevo.vencimiento"
              type="date"
              class="form-control mb-2"
              required
            />
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn btn-success w-100">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <div class="d-grid mb-3">
      <button class="btn btn-outline-success" @click="abrirModal">Nuevo reporte</button>
    </div>
    <!-- Tabla de reportes -->
    <div class="table-responsive d-none d-md-block">
      <table class="table table-bordered align-middle text-center">
        <thead class="table-light">
          <tr>
            <th class="text-secondary">Tipo</th>
            <th class="text-secondary">Subtipo</th>
            <th class="text-secondary">Linea</th>
            <th class="text-secondary">Folio</th>
            <th class="text-secondary">Dictamen</th>
            <th class="text-secondary">Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reporte in reportesPaginados" :key="reporte.id">
            <td>{{ reporte.tipo }}</td>
            <td>{{ reporte.subtipo }}</td>
            <td>{{ reporte.linea }}</td>
            <td>{{ reporte.folio }}</td>
            <td>{{ formatoFecha(reporte.dictamen) }}</td>
            <td>{{ formatoFecha(reporte.vencimiento) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vista móvil -->
    <div class="d-md-none">
      <div
        v-for="reporte in reportesPaginados"
        :key="reporte.id"
        class="border rounded-3 shadow-sm mb-3 p-3"
      >
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Tipo</span>
          <span class="fw-semibold text-dark">{{ reporte.tipo }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Subtipo</span>
          <span class="fw-semibold text-dark">{{ reporte.subtipo }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Linea</span>
          <span class="fw-semibold text-dark">{{ reporte.linea }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Folio</span>
          <span class="fw-semibold text-dark">{{ reporte.folio }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Dictamen</span>
          <span class="fw-semibold text-dark">{{ formatoFecha(reporte.dictamen) }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted small">Vencimiento</span>
          <span class="fw-semibold text-danger">{{
            formatoFecha(reporte.vencimiento)
          }}</span>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <nav class="mt-3">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li class="page-item disabled">
          <span class="page-link">Página {{ paginaActual }}</span>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual >= totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import dayjs from "dayjs";
import { watch } from "vue";
const formatoFecha = (fecha) => {
  return dayjs(fecha).format("DD/MM/YYYY");
};

const user = JSON.parse(localStorage.getItem("user"));
const centroId = user?.centroId || "sin-centro";

const centro = ref(null);

const cargarCentro = async () => {
  if (!centroId) return;
  const snapshot = await getDocs(collection(db, "centros"));
  const centros = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  centro.value = centros.find((c) => c.id === centroId);
};

const nuevo = ref({
  tipo: "",
  folio: "",
  dictamen: "",
  vencimiento: "",
});

const reportesLab = ref([]);

const calibraciones = {
  ANALIZADORES: {
    aplica: "todasLineas",
    frecuencia: { meses: 3 },
    subtipos: ["Analizadores"],
  },
  OPACIMETRO: {
    aplica: "lineaDual",
    frecuencia: { meses: 3 },
    subtipos: ["Opacímetro"],
  },
  DINAMOMETROS: {
    aplica: "todasLineas",
    frecuencia: { meses: 6 },
    subtipos: ["Celda de carga", "Rodillo, brazo y palanca", "Parásitas", "Dinamómetro"],
  },
  TACOMETROS: {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Pinza", "Batería", "No. Contacto"],
  },
  "ESTACIÓN METEOROLÓGICA": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Humedad", "Presión", "Temperatura"],
  },
  DIESEL: {
    aplica: "lineaDual",
    frecuencia: { años: 1 },
    subtipos: ["Termocopla", "Lector óptico"],
  },
  MANTENIMIENTO: {
    aplica: "todasLineas",
    frecuencia: { meses: 1 },
    subtipos: ["Cambio mangueras", "Cambio de filtros", "Limpieza gabinetes"],
  },
  DINAMICAS: {
    aplica: "todasLineas",
    frecuencia: { meses: 1 },
    subtipos: [],
  },
  MANOMETROS: {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: [],
  },
  PESAS: {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: [],
  },
  "FILTRO DE CALIBRACIÓN": {
    aplica: "lineaDual",
    frecuencia: { años: 1 },
    subtipos: [],
  },
};

const guardarReporteLab = async () => {
  const config = calibraciones[nuevo.value.tipo];
  const reporte = {
    ...nuevo.value,
    centroId,
  };

  if (config?.aplica === "todasLineas") {
    reporte.linea = nuevo.value.linea;
  }
  if (config?.aplica === "lineaDual") {
    reporte.linea = centro.value.lineaDual;
  }
  if (config?.aplica === "centro") {
    reporte.linea = null; // no aplica línea
  }

  await addDoc(collection(db, "ReporteLab"), reporte);

  nuevo.value = {
    tipo: "",
    subtipo: "",
    folio: "",
    dictamen: "",
    vencimiento: "",
    linea: "",
  };
  bootstrap.Modal.getInstance(document.getElementById("modalLab")).hide();
  cargarReportesLab();
};

const cargarReportesLab = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId;

  if (!centroId) {
    console.warn("[⚠️ No se encontró centroId para el usuario]");
    reportesLab.value = [];
    return;
  }

  const snapshot = await getDocs(collection(db, "ReporteLab"));
  const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  reportesLab.value = todos
    .filter((r) => r.centroId === centroId)
    .sort((a, b) => new Date(b.dictamen) - new Date(a.dictamen));
};

const abrirModal = () => {
  new bootstrap.Modal(document.getElementById("modalLab")).show();
};

const paginaActual = ref(1);
const porPagina = 10;

const reportesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return reportesLab.value.slice(inicio, inicio + porPagina);
});
watch([() => nuevo.value.dictamen, () => nuevo.value.tipo], ([fecha, tipo]) => {
  if (!fecha || !tipo || !calibraciones[tipo]) return;

  const config = calibraciones[tipo];
  let vencimiento = dayjs(fecha);

  if (config.frecuencia.años) {
    vencimiento = vencimiento.add(config.frecuencia.años, "year");
  } else if (config.frecuencia.meses) {
    vencimiento = vencimiento.add(config.frecuencia.meses, "month");
  }

  nuevo.value.vencimiento = vencimiento.format("YYYY-MM-DD");
});
const totalPaginas = computed(() => {
  return Math.ceil(reportesLab.value.length / porPagina);
});

onMounted(() => {
  cargarReportesLab();
  cargarCentro()
});
</script>
