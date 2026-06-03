<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Reportes Laboratorios</h3>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th class="d-none d-md-table-cell">Subtipo</th>
            <th>Línea</th>
            <th>Folio</th>
            <th>Dictamen</th>
            <th>Fecha de calibracion</th>
            <th>Vencimiento</th>
            <th class="d-none d-md-table-cell">Centro</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="reporte in reportesFiltradosPaginados"
            :key="reporte.id"
            :class="{
              'table-danger': estadoVencimiento(reporte.vencimiento) === 'vencido',
              'table-warning': estadoVencimiento(reporte.vencimiento) === 'proximo',
            }"
          >
            <td>
              <span class="type-pill">{{ reporte.tipo }}</span>
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ reporte.subtipo }}
            </td>

            <td class="fw-medium">
              {{ reporte.linea }}
            </td>

            <td>
              <span class="folio-pill">
                {{ reporte.folio }}
              </span>
            </td>

            <td class="text-muted small">
              {{ formatoFecha(reporte.dictamen) }}
            </td>

             <td class="text-muted small">
              {{ formatoFecha(reporte.calibracion) }}
            </td>

            <td>
              <span class="date-pill">
                {{ formatoFecha(reporte.vencimiento) }}
              </span>
            </td>

            <td class="d-none d-md-table-cell">
              {{ nombreCentro(reporte.centroId) }}
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <!-- Botón Ver PDF solo si existe -->
                <template v-if="reporte.pdfUrl">
                  <a
                    :href="reporte.pdfUrl"
                    target="_blank"
                    class="btn btn-light btn-sm text-success"
                    title="Ver PDF"
                  >
                    <i class="bi bi-file-earmark-pdf"></i>
                  </a>
                </template>

                <!-- Botones de edición y eliminación -->
                <button
                  class="btn btn-light btn-sm"
                  @click="abrirModalEdicion(reporte)"
                  title="Editar"
                >
                  <i class="bi bi-pencil-square"></i>
                </button>

                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarReporte(reporte.id)"
                  title="Eliminar"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <nav class="mt-3">
      <ul class="pagination pagination-sm justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>

        <li class="page-item disabled">
          <span class="page-link"> Página {{ paginaActual }} </span>
        </li>

        <li class="page-item" :class="{ disabled: paginaActual >= totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>

    <!-- Modal edición -->
    <div
      class="modal fade"
      id="modalEdicion"
      tabindex="-1"
      aria-labelledby="modalEdicionLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalEdicionLabel">Editar reporte</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Cerrar"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label small">Tipo</label>
              <input
                v-model="reporteEditado.tipo"
                type="text"
                class="form-control form-control-sm"
              />
            </div>

            <div class="mb-2">
              <label class="form-label small">Folio</label>
              <input
                v-model="reporteEditado.folio"
                type="text"
                class="form-control form-control-sm"
              />
            </div>

            <div class="mb-2">
              <label class="form-label small">Dictamen</label>
              <input
                v-model="reporteEditado.dictamen"
                type="date"
                class="form-control form-control-sm"
              />
            </div>

            <div class="mb-2">
              <label class="form-label small">Vencimiento</label>
              <input
                v-model="reporteEditado.vencimiento"
                type="date"
                class="form-control form-control-sm"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button class="btn btn-success btn-sm" @click="guardarCambiosReporte">
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { db } from "../../servivces/auth.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useRoute } from "vue-router";

const route = useRoute();
const centroId = route.params.centroId;
const reportesLab = ref([]);
const centros = ref([]);
const paginaActual = ref(1);
const porPagina = 15;
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
    console.error("[Error al eliminar reporte]", error);
  }
};
const cargarReportesLab = async () => {
  const q = query(
    collection(db, "ReporteLab"),
    where("centroId", "==", centroId),
    orderBy("vencimiento", "asc")
  );

  const snapshot = await getDocs(q);
  reportesLab.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const nombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);
  return centro ? centro.ubicacion : "Desconocido";
};
const estadoVencimiento = (fecha) => {
  if (!fecha) return "ok";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = parseFechaLocal(fecha);

  if (!vencimiento) return "ok";

  vencimiento.setHours(0, 0, 0, 0);

  const diffDias = Math.ceil(
    (vencimiento - hoy) / (1000 * 60 * 60 * 24)
  );

  if (diffDias < 0) return "vencido";
  if (diffDias <= 30) return "proximo";

  return "ok";
};

const reportesFiltrados = computed(() => {
  return reportesLab.value.filter((r) => r.centroId === centroId);
});

const reportesFiltradosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return reportesFiltrados.value.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  return Math.ceil(reportesFiltrados.value.length / porPagina);
});
const parseFechaLocal = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== "string") {
    return null;
  }

  const [year, month, day] = fechaStr.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatoFecha = (fecha) => {
  const fechaParseada = parseFechaLocal(fecha);

  if (!fechaParseada) {
    return "Sin fecha";
  }

  return fechaParseada.toLocaleDateString("es-MX");
};

onMounted(() => {
  cargarReportesLab();
  cargarCentros();
});
</script>
<style scoped>
/* Base corporativa */
.infra-table {
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}

.infra-table thead th {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
}

.infra-table tbody tr {
  transition: background 0.15s ease;
}

.infra-table tbody tr:hover {
  background: #f8f9fa;
}

.infra-table td {
  vertical-align: middle;
  border-top: none;
}

/* Pills */
.type-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #eef1f4;
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

.folio-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #f1f3f5;
  font-size: 0.75rem;
  font-weight: 600;
  color: #212529;
}

.date-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #e9ecef;
  font-size: 0.75rem;
  color: #495057;
}

/* Acciones */
.action-buttons {
  display: inline-flex;
  gap: 6px;
}
</style>
