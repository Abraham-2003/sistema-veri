<template>
  <div class="container py-3">
    <h3 class="mb-4">Reportes Laboratorios</h3>

    <!-- Filtro de centros -->
    <div class="mb-3">
      <label class="form-label text-muted">Filtrar por centro</label>
      <select v-model="centroSeleccionado" class="form-select">
        <option value="">Todos los centros</option>
        <option v-for="centro in centros" :key="centro.id" :value="centro.id">
          {{ centro.ubicacion }}
        </option>
      </select>
    </div>

    <!-- Tabla de reportes -->
    <div class="table-responsive">
      <table class="table table-sm table-bordered align-middle text-center table-hover">
        <thead class="table-dark bg-opacity-25">
          <tr>
            <th>Tipo</th>
            <th>Folio</th>
            <th>Dictamen</th>
            <th>Vencimiento</th>
            <th>Centro</th>
            <th>Acciones</th>
            <!-- Nueva columna -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="reporte in reportesFiltradosPaginados" :key="reporte.id">
            <td>{{ reporte.tipo }}</td>
            <td>{{ reporte.folio }}</td>
            <td>{{ formatoFecha(reporte.dictamen) }}</td>
            <td>{{ formatoFecha(reporte.vencimiento) }}</td>
            <td>{{ nombreCentro(reporte.centroId) }}</td>
            <td>
              <button
                class="btn btn-warning btn-sm me-2"
                @click="abrirModalEdicion(reporte)"
              >
                Editar
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="eliminarReporte(reporte.id)"
              >
                Eliminar
              </button>
            </td>
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
    <div class="modal fade" id="modalEdicion" tabindex="-1" aria-labelledby="modalEdicionLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modalEdicionLabel">Editar reporte</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <div class="mb-2">
          <label class="form-label">Tipo</label>
          <input v-model="reporteEditado.tipo" type="text" class="form-control" />
        </div>
        <div class="mb-2">
          <label class="form-label">Folio</label>
          <input v-model="reporteEditado.folio" type="text" class="form-control" />
        </div>
        <div class="mb-2">
          <label class="form-label">Dictamen</label>
          <input v-model="reporteEditado.dictamen" type="date" class="form-control" />
        </div>
        <div class="mb-2">
          <label class="form-label">Vencimiento</label>
          <input v-model="reporteEditado.vencimiento" type="date" class="form-control" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-success" @click="guardarCambiosReporte">Guardar cambios</button>
      </div>
    </div>
  </div>
</div>

  </div>
</template>
<script setup>
import { ref, onMounted, computed,  } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const reportesLab = ref([]);
const centros = ref([]);
const centroSeleccionado = ref("");
const paginaActual = ref(1);
const porPagina = 10;
const reporteEditado = ref({});
const modal = ref(null);

const abrirModalEdicion = (reporte) => {
  console.log("[✏️ Editar reporte]", reporte);
  reporteEditado.value = { ...reporte };

  const modalElement = document.getElementById("modalEdicion");
  if (modalElement) {
    modal.value = new bootstrap.Modal(modalElement);
    modal.value.show();
  } else {
    console.warn("[⚠️ No se encontró el elemento del modal]");
  }
};

const guardarCambiosReporte = async () => {
  try {
    const { id, ...datosActualizados } = reporteEditado.value;
    await updateDoc(doc(db, "ReporteLab", id), datosActualizados);
    console.log("[✅ Reporte actualizado]", id);

    if (modal.value) {
      modal.value.hide();
    }

    await cargarReportesLab(); // Recarga la lista
  } catch (error) {
    console.error("[❌ Error al actualizar reporte]", error);
  }
};

const eliminarReporte = async (id) => {
  const confirmacion = confirm("¿Estás seguro de que deseas eliminar este reporte?");
  if (!confirmacion) return;

  try {
    await deleteDoc(doc(db, "ReporteLab", id));
    console.log("[🗑️ Reporte eliminado]", id);
    await cargarReportesLab();
  } catch (error) {
    console.error("[❌ Error al eliminar reporte]", error);
  }
};
const cargarReportesLab = async () => {
  const snapshot = await getDocs(
    query(collection(db, "ReporteLab"), orderBy("dictamen", "desc"))
  );
  reportesLab.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const nombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);
  return centro ? centro.ubicacion : "Desconocido";
};

const reportesFiltrados = computed(() => {
  if (!centroSeleccionado.value) return reportesLab.value;
  return reportesLab.value.filter((r) => r.centroId === centroSeleccionado.value);
});

const reportesFiltradosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return reportesFiltrados.value.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  return Math.ceil(reportesFiltrados.value.length / porPagina);
});

const formatoFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-MX");
};

onMounted(() => {
  cargarReportesLab();
  cargarCentros();
});
</script>
