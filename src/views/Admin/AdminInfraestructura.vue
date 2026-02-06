<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Estado de Infraestructura</h3>
      <button class="btn btn-primary btn-sm" @click="abrirModal()">
        + Nuevo elemento
      </button>
    </div>

    <!-- Filtro -->
    <div class="row mb-3">
      <div class="col-md-4">
        <select v-model="filtroCentro" class="form-select form-select-sm">
          <option value="">Todos los centros</option>
          <option v-for="centro in centros" :key="centro.id" :value="centro.id">
            {{ centro.ubicacion }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Elemento</th>
            <th>Estatus</th>
            <th>Áreas con falla</th>
            <th class="d-none d-md-table-cell">Última revisión</th>
            <th class="d-none d-lg-table-cell">Observaciones</th>
            <th class="d-none d-md-table-cell">Centro</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in infraestructuraPaginados" :key="item.id">
            <td class="fw-medium">{{ item.elemento }}</td>

            <td>
              <span
                class="status-pill"
                :class="item.estatus === 'Operativo' ? 'ok' : 'fail'"
              >
                {{ item.estatus }}
              </span>
            </td>

            <td>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="(area, index) in item.areasConFalla || []"
                  :key="index"
                  class="badge area-badge"
                >
                  {{ area }}
                </span>
                <span
                  v-if="!item.areasConFalla || item.areasConFalla.length === 0"
                  class="text-muted small"
                >
                  Sin fallas
                </span>
              </div>
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ item.ultimaRevision }}
            </td>

            <td class="d-none d-lg-table-cell text-truncate obs-cell">
              {{ item.observaciones || '—' }}
            </td>

            <td class="d-none d-md-table-cell">
              {{ obtenerNombreCentro(item.centroId) }}
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <button
                  class="btn btn-light btn-sm"
                  @click="abrirModal(item)"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarInfraestructura(item)"
                  title="Eliminar"
                >
                  🗑
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
          <button class="page-link" @click="paginaActual--">Anterior</button>
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
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>

    <!-- Modal -->
    <div class="modal fade" id="modalInfra" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarInfraestructura">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editando ? "Editar elemento" : "Nuevo elemento" }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <input
              v-model="nuevo.elemento"
              placeholder="Elemento"
              class="form-control form-control-sm mb-3"
            />

            <label class="form-label small">Áreas asignadas</label>

            <div
              v-for="(area, index) in nuevo.areas"
              :key="index"
              class="input-group input-group-sm mb-2"
            >
              <input
                v-model="nuevo.areas[index]"
                type="text"
                class="form-control"
                placeholder="Área"
              />
              <button
                class="btn btn-outline-danger"
                @click.prevent="eliminarArea(index)"
              >
                ✕
              </button>
            </div>

            <button
              class="btn btn-outline-secondary btn-sm mb-3"
              @click.prevent="agregarArea"
            >
              + Agregar área
            </button>

            <select v-model="nuevo.estatus" class="form-select form-select-sm mb-3">
              <option value="Operativo">Operativo</option>
              <option value="Fuera de servicio">Fuera de servicio</option>
            </select>

            <textarea
              v-model="nuevo.observaciones"
              placeholder="Observaciones"
              class="form-control form-control-sm mb-3"
            />

            <select
              v-model="nuevo.centroId"
              class="form-select form-select-sm"
            >
              <option disabled value="">Selecciona un centro</option>
              <option v-for="centro in centros" :key="centro.id" :value="centro.id">
                {{ centro.ubicacion }}
              </option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn btn-primary btn-sm">Guardar</button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-bs-dismiss="modal"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { db } from "../../servivces/auth.js";
import Swal from "sweetalert2";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const infraestructura = ref([]);
const centros = ref([]);
const filtroCentro = ref("");
const nuevo = ref({
  elemento: "",
  estatus: "Operativo",
  observaciones: "",
  centroId: "",
  areas: [],
});
const editando = ref(null);
const paginaActual = ref(1);
const porPagina = 10;

const agregarArea = () => {
  nuevo.value.areas.push("");
};

const eliminarArea = (index) => {
  nuevo.value.areas.splice(index, 1);
};

const eliminarInfraestructura = async (item) => {
  const result = await Swal.fire({
    title: "¿Eliminar elemento?",
    text: `Se eliminará "${item.elemento}" de forma permanente.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteDoc(doc(db, "infraestructura", item.id));

    Swal.fire({
      icon: "success",
      title: "Eliminado",
      text: "El elemento fue eliminado correctamente.",
      timer: 1500,
      showConfirmButton: false,
    });

    cargarInfraestructura();
  } catch (error) {
    console.error("[Error al eliminar infraestructura]", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar el elemento.",
    });
  }
};

const cargarInfraestructura = async () => {
  const snapshot = await getDocs(collection(db, "infraestructura"));
  infraestructura.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const guardarInfraestructura = async () => {
  const hoy = new Date().toISOString().split("T")[0];
  nuevo.value.ultimaRevision = hoy;
  // Si el estatus es "Operativo", eliminamos las áreas con falla
  if (nuevo.value.estatus === "Operativo") {
    nuevo.value.areasConFalla = [];
  }

  if (editando.value) {
    await updateDoc(doc(db, "infraestructura", editando.value), { ...nuevo.value });
    editando.value = null;
  } else {
    await addDoc(collection(db, "infraestructura"), { ...nuevo.value });
  }

  nuevo.value = { elemento: "", estatus: "Operativo", observaciones: "", centroId: "" };
  bootstrap.Modal.getInstance(document.getElementById("modalInfra")).hide();
  cargarInfraestructura();
};

const abrirModal = (item = null) => {
  if (item) {
    nuevo.value = { ...item };
    editando.value = item.id;
  } else {
    nuevo.value = {
      elemento: "",
      estatus: "Operativo",
      observaciones: "",
      centroId: "",
      areas: [],
    };
    editando.value = null;
  }
  new bootstrap.Modal(document.getElementById("modalInfra")).show();
};

const infraestructuraFiltrada = computed(() => {
  if (!filtroCentro.value) return infraestructura.value;
  return infraestructura.value.filter((i) => i.centroId === filtroCentro.value);
});

const obtenerNombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);
  return centro ? centro.ubicacion : "—";
};
const totalPaginas = computed(() =>
  Math.ceil(infraestructuraFiltrada.value.length / porPagina)
);

const infraestructuraPaginados = computed(() => {
  const datosFiltrados = infraestructuraFiltrada.value;
  const inicio = (paginaActual.value - 1) * porPagina;
  return datosFiltrados.slice(inicio, inicio + porPagina);
});

onMounted(() => {
  cargarInfraestructura();
  cargarCentros();
});
</script>
<style scoped>
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

.status-pill {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pill.ok {
  background: #e6f4ea;
  color: #198754;
}

.status-pill.fail {
  background: #fdecea;
  color: #dc3545;
}

.area-badge {
  background: #f1f3f5;
  color: #495057;
  font-size: 0.7rem;
}

.action-buttons {
  display: inline-flex;
  gap: 6px;
}

.obs-cell {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>