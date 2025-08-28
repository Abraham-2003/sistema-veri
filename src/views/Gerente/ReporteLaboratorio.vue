<template>
  <div class="container py-3">
    <h5 class="text-center text-success mb-4">Reportes de Laboratorio</h5>

    <!-- Botón para abrir el modal -->
    
    <div class="modal fade" id="modalLab" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarReporteLab">
          <div class="modal-header bg-success bg-opacity-10">
            <h6 class="modal-title ">Agregar reporte</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
          <label class="form-label small text-muted">Tipo</label>
            <input
              v-model="nuevo.tipo"
              placeholder="Tipo (ej. Pesas)"
              class="form-control mb-2"
              required
            />
            <label class="form-label small text-muted">Folio</label>
            <input
              v-model="nuevo.folio"
              placeholder="Folio"
              class="form-control mb-2"
              required
            />
            <label class="form-label small text-muted">Fecha de dictamen</label>
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

    <!-- Tabla de reportes -->
    <div class="table-responsive ">
      <table class="table table-lg table-bordered align-middle text-center">
        <thead class="table-success bg-opacity-25">
          <tr>
            <th class="text-success">Tipo</th>
            <th class="text-success">Folio</th>
            <th class="text-success">Dictamen</th>
            <th class="text-success">Vencimiento</th>
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
    <div class="d-grid mb-3">
      <button class="btn btn-outline-success" @click="abrirModal">
        Nuevo reporte
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const user = JSON.parse(localStorage.getItem("user"));
const centroId = user?.centroId || "sin-centro";

const nuevo = ref({
  tipo: "",
  folio: "",
  dictamen: "",
  vencimiento: "",
});

const reportesLab = ref([]);

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

const formatoFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-MX");
};
const paginaActual = ref(1);
const porPagina = 5;

const reportesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return reportesLab.value.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  return Math.ceil(reportesLab.value.length / porPagina);
});

onMounted(() => {
  cargarReportesLab();
});
</script>
