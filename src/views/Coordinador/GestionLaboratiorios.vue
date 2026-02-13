<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Gestión de Laboratorios</h3>

      <button class="btn btn-success btn-sm" @click="abrirModal()">
        Nuevo laboratorio
      </button>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th class="d-none d-md-table-cell">Contacto</th>
            <th>Servicios</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="lab in laboratoriosPaginados" :key="lab.id">
            <td class="fw-medium">
              {{ lab.nombre }}
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ lab.contacto }}
            </td>

            <td>
              <div class="service-pills">
                <span
                  v-for="(servicio, index) in lab.servicios"
                  :key="index"
                  class="service-pill"
                >
                  {{ servicio }}
                </span>

                <span
                  v-if="!lab.servicios || lab.servicios.length === 0"
                  class="text-muted small"
                >
                  —
                </span>
              </div>
            </td>
          </tr>

          <tr v-if="laboratoriosPaginados.length === 0">
            <td colspan="4" class="text-center text-muted py-4">
              No hay laboratorios registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <nav class="mt-3">
      <ul class="pagination pagination-sm justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">
            Anterior
          </button>
        </li>

        <li class="page-item disabled">
          <span class="page-link">
            Página {{ paginaActual }}
          </span>
        </li>

        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">
            Siguiente
          </button>
        </li>
      </ul>
    </nav>

    <!-- Modal -->
    <div class="modal fade" id="modalLaboratorio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarLaboratorio">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editando ? "Editar laboratorio" : "Nuevo laboratorio" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label small">Nombre</label>
              <input v-model="nuevo.nombre" class="form-control form-control-sm" />
            </div>

            <div class="mb-2">
              <label class="form-label small">Contacto</label>
              <input v-model="nuevo.contacto" class="form-control form-control-sm" />
            </div>

            <label class="form-label small">Servicios que ofrece</label>
            <div class="input-group input-group-sm mb-2">
              <input
                v-model="servicioTemp"
                placeholder="Ej. pesas, calibradores..."
                class="form-control"
              />
              <button
                type="button"
                class="btn btn-outline-primary"
                @click="agregarServicio"
              >
                Agregar
              </button>
            </div>

            <ul class="list-group list-group-sm">
              <li
                v-for="(servicio, index) in nuevo.servicios"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                {{ servicio }}
                <button
                  type="button"
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarServicio(index)"
                >
                  ✖
                </button>
              </li>
            </ul>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-bs-dismiss="modal"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-success btn-sm">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const laboratorios = ref([]);
const editando = ref(null);
const paginaActual = ref(1);
const porPagina = 10;

const nuevo = ref({
  nombre: "",
  contacto: "",
  servicios: [],
});

const servicioTemp = ref("");

const agregarServicio = () => {
  const s = servicioTemp.value.trim();
  if (s && !nuevo.value.servicios.includes(s)) {
    nuevo.value.servicios.push(s);
    servicioTemp.value = "";
  }
};

const eliminarServicio = (index) => {
  nuevo.value.servicios.splice(index, 1);
};

const cargarLaboratorios = async () => {
  const snapshot = await getDocs(collection(db, "laboratorios"));
  laboratorios.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const guardarLaboratorio = async () => {
  if (editando.value) {
    await updateDoc(doc(db, "laboratorios", editando.value), { ...nuevo.value });
    editando.value = null;
  } else {
    await addDoc(collection(db, "laboratorios"), { ...nuevo.value });
  }
  nuevo.value = { nombre: "", contacto: "", servicios: [] };
  bootstrap.Modal.getInstance(document.getElementById("modalLaboratorio")).hide();
  cargarLaboratorios();
};

const abrirModal = (lab = null) => {
  if (lab) {
    nuevo.value = {
      nombre: lab.nombre || "",
      contacto: lab.contacto || "",
      servicios: Array.isArray(lab.servicios) ? lab.servicios : [],
    };
    editando.value = lab.id;
  } else {
    nuevo.value = {
      nombre: "",
      contacto: "",
      servicios: [],
    };
    editando.value = null;
  }
  new bootstrap.Modal(document.getElementById("modalLaboratorio")).show();
};

const eliminarLaboratorio = async (id) => {
  await deleteDoc(doc(db, "laboratorios", id));
  cargarLaboratorios();
};

const totalPaginas = computed(() => Math.ceil(laboratorios.value.length / porPagina));
const laboratoriosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return laboratorios.value.slice(inicio, inicio + porPagina);
});

onMounted(() => {
  cargarLaboratorios();
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
.service-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.service-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #eef1f4;
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

/* Acciones */
.action-buttons {
  display: inline-flex;
  gap: 6px;
}
</style>