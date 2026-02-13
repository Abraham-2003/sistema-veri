<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Órdenes de Servicio</h3>
    </div>

    <!-- Filtro -->
    <div class="row mb-3">
      <div class="col-md-4">
        <label class="form-label small">Centro</label>
        <select v-model="centroFiltro" class="form-select form-select-sm">
          <option value="">Selecciona un centro</option>
          <option v-for="c in centros" :key="c.id" :value="c.id">
            {{ c.ubicacion }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Centro</th>
            <th>Fecha</th>
            <th>Orden #</th>
            <th class="d-none d-md-table-cell">Falla reportada</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="orden in ordenesPaginadas" :key="orden.id">
            <td class="fw-medium">
              {{ nombreCentro(orden.centroId) }}
            </td>

            <td class="text-muted small">
              {{ orden.fecha }}
            </td>

            <td>
              <span class="order-pill">
                {{ orden.ordenNumero }}
              </span>
            </td>

            <td class="d-none d-md-table-cell text-truncate falla-cell">
              {{ orden.falla }}
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <button
                  class="btn btn-light btn-sm"
                  @click="verDetalles(orden)"
                  title="Ver detalles"
                >
                  <i class="bi bi-eye"></i>
                </button>
                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarOrden(orden.id)"
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
      <ul class="pagination pagination-sm justify-content-end">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">
            Anterior
          </button>
        </li>

        <li
          class="page-item"
          v-for="n in totalPaginas"
          :key="n"
          :class="{ active: paginaActual === n }"
        >
          <button class="page-link" @click="paginaActual = n">
            {{ n }}
          </button>
        </li>

        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">
            Siguiente
          </button>
        </li>
      </ul>
    </nav>

    <!-- Modal Detalles -->
    <div class="modal fade" id="modalDetalles" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la Orden</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <p><strong>Centro:</strong> {{ nombreCentro(seleccionada.centroId) }}</p>
              <p><strong>Fecha:</strong> {{ seleccionada.fecha }}</p>
              <p><strong>Orden #:</strong> {{ seleccionada.ordenNumero }}</p>
              <p>
                <strong>Líneas:</strong>
                {{
                  Array.isArray(seleccionada.lineas)
                    ? seleccionada.lineas.join(", ")
                    : "—"
                }}
              </p>
              <p><strong>Hora inicio:</strong> {{ seleccionada.horaInicio }}</p>
              <p><strong>Hora término:</strong> {{ seleccionada.horaTermino }}</p>
              <p><strong>Recibe:</strong> {{ seleccionada.recibe }}</p>
              <p><strong>Proveedor:</strong> {{ seleccionada.proveedor }}</p>
              <p><strong>Técnico:</strong> {{ seleccionada.tecnico }}</p>
              <p><strong>Reporte #:</strong> {{ seleccionada.reporteNumero }}</p>
              <p><strong>Falla:</strong> {{ seleccionada.falla }}</p>
              <p><strong>Trabajo:</strong> {{ seleccionada.trabajo }}</p>
              <p><strong>Status:</strong> {{ seleccionada.status }}</p>
              <p><strong>Observaciones:</strong> {{ seleccionada.observaciones }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const ordenes = ref([]);
const centros = ref([]);
const seleccionada = ref({});
const paginaActual = ref(1);
const porPagina = 10;
const centroFiltro = ref(""); // aquí guardamos el id del centro seleccionado

const cargarOrdenes = async () => {
  const snapshot = await getDocs(collection(db, "ordenesServicio"));
  ordenes.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const nombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);
  return centro ? centro.ubicacion : "Sin centro";
};

const verDetalles = (orden) => {
  seleccionada.value = orden;
  new bootstrap.Modal(document.getElementById("modalDetalles")).show();
};

const eliminarOrden = async (id) => {
  await deleteDoc(doc(db, "ordenesServicio", id));
  cargarOrdenes();
};
const ordenesFiltradas = computed(() => {
  let filtradas = [...ordenes.value];

  if (centroFiltro.value) {
    filtradas = filtradas.filter((o) => o.centroId === centroFiltro.value);
  }

  return filtradas
    .filter((o) => o.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
});

const totalPaginas = computed(() => Math.ceil(ordenesFiltradas.value.length / porPagina));

const ordenesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return ordenesFiltradas.value.slice(inicio, inicio + porPagina);
});

onMounted(() => {
  cargarOrdenes();
  cargarCentros();
});
</script>

<style scoped>
/* Tabla base corporativa */
.infra-table {
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}

.infra-table thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

/* Orden */
.order-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #eef1f4;
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

/* Texto largo */
.falla-cell {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Acciones */
.action-buttons {
  display: inline-flex;
  gap: 6px;
}

/* Modal */
.detail-grid p {
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}
</style>
