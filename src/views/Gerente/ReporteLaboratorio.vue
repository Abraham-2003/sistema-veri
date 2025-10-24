<template>
  <div class="container py-3">
    <h5 class="text-center text-success mb-4">Reportes de Laboratorio</h5>

    <!-- Botón para abrir el modal -->

    <div class="modal fade" id="modalLab" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarReporteLab">
          <div class="modal-headers bg-opacity-10">
            <h6 class="modal-title">Agregar reporte</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <label class="form-label small text-muted">Tipo</label>
            <select v-model="nuevo.tipo" class="form-select mb-2" required>
              <option disabled value="">Selecciona un tipo</option>
              <option
                v-for="(config, nombre) in calibraciones"
                :key="nombre"
                :value="nombre"
              >
                {{ nombre }}
              </option>
            </select>
            <div
              v-if="nuevo.tipo && calibraciones[nuevo.tipo]"
              class="alert alert-info border-start border-3 border-primary shadow-sm mb-3"
            >
              <div class="fw-semibold mb-1">Información de calibración</div>
              <ul class="list-unstyled small mb-0">
                <li><strong>Tipo:</strong> {{ nuevo.tipo }}</li>
                <li>
                  <strong>Periodicidad:</strong>
                  <span v-if="calibraciones[nuevo.tipo].frecuencia.años">
                    Cada {{ calibraciones[nuevo.tipo].frecuencia.años }} año(s)
                  </span>
                  <span v-else-if="calibraciones[nuevo.tipo].frecuencia.meses">
                    Cada {{ calibraciones[nuevo.tipo].frecuencia.meses }} mes(es)
                  </span>
                </li>
                <li v-if="nuevo.dictamen">
                  <strong>Fecha de calibración:</strong>
                  {{ formatoFecha(nuevo.dictamen) }}
                </li>
                <li v-if="nuevo.vencimiento">
                  <strong>Fecha de vencimiento:</strong>
                  {{ formatoFecha(nuevo.vencimiento) }}
                </li>
              </ul>
            </div>

            <label class="form-label small text-muted">Folio</label>
            <input
              v-model="nuevo.folio"
              placeholder="Folio"
              class="form-control mb-2"
              required
            />
            <label class="form-label small text-muted">Fecha de calibracion</label>
            <input
              v-model="nuevo.dictamen"
              type="date"
              class="form-control mb-3"
              required
            />
            <label class="form-label small text-muted"
              >Fecha de vencimiento calibracion</label
            >
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
            <th class="text-secondary">Folio</th>
            <th class="text-secondary">Dictamen</th>
            <th class="text-secondary">Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reporte in reportesPaginados" :key="reporte.id">
            <td>{{ reporte.tipo }}</td>
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

const nuevo = ref({
  tipo: "",
  folio: "",
  dictamen: "",
  vencimiento: "",
});

const reportesLab = ref([]);

const calibraciones = {
  "ANALIZADORES DE GASES": { frecuencia: { meses: 3 } },
  MANOMETROS: { frecuencia: { años: 1 } },
  OPACIMETRO: { frecuencia: { meses: 3 } },
  TACOMETROS: { frecuencia: { años: 1 } },
  "ESTACIONES METEOROLOGICAS": { frecuencia: { años: 1 } },
  DINAMOMETROS: { frecuencia: { meses: 6 } },
  "CELDAS DE CARGA": { frecuencia: { años: 1 } },
  PESAS: { frecuencia: { años: 1 } },
  "FILTRO DE OPACIDAD": { frecuencia: { años: 1 } },
  TERMOCOPLA: { frecuencia: { años: 1 } },
};

const guardarReporteLab = async () => {
  await addDoc(collection(db, "ReporteLab"), {
    ...nuevo.value,
    centroId,
  });

  nuevo.value = {
    tipo: "",
    folio: "",
    dictamen: "",
    vencimiento: "",
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
const porPagina = 3;

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
});
</script>
