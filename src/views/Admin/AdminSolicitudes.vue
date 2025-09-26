<template>
  <div class="container py-4">
    <h3 class="mb-4">Histórico de Solicitudes</h3>

    <!-- Filtro por centro -->
    <select v-model="filtroCentro" class="form-select mb-3">
      <option value="">Todos los centros activos</option>
      <option v-for="centro in centros" :key="centro.id" :value="centro.id">
        {{ centro.ubicacion }}
      </option>
    </select>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Centro</th>
          <th>Tipo</th>
          <th>Elemento</th>
          <th>Proveedor o Laboratorio</th>
          <th>Fecha de Solicitud</th>
          <th>Fecha de Pago</th>
          <th>Fecha de Entrega</th>
          <th>Observaciones</th>
          <th>Estatus</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sol in solicitudesFiltradas" :key="sol.id">
          <td>{{ nombreCentro(sol.centroId) }}</td>
          <td>{{ sol.tipo }}</td>
          <td>{{ sol.elemento }}</td>
          <td>{{ sol.proveedor }}</td>
          <td>{{ sol.fechaSolicitud }}</td>
          <td>{{ sol.fechaPago }}</td>
          <td>{{ sol.fechaEntrega }}</td>
          <td>{{ sol.observaciones }}</td>
          <td
            class="badge"
            :class="sol.estatus === 'Pendiente' ? 'bg-warning' : 'bg-success'"
          >
            {{ sol.estatus }}
          </td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="abrirModalEdicion(sol)">
              Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="eliminarSolicitud(sol.id)">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <nav>
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li
          class="page-item"
          v-for="n in totalPaginas"
          :key="n"
          :class="{ active: paginaActual === n }"
        >
          <button class="page-link" @click="paginaActual = n">{{ n }}</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>
  </div>
  <div class="modal fade" id="modalEdicion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar Solicitud</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="form-label">Tipo</label>
            <input v-model="solicitudEditada.tipo" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Proveedor</label>
            <input
              v-model="solicitudEditada.proveedor"
              type="text"
              class="form-control"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Fecha de Solicitud</label>
            <input
              v-model="solicitudEditada.fechaSolicitud"
              type="date"
              class="form-control"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Fecha de Pago</label>
            <input
              v-model="solicitudEditada.fechaPago"
              type="date"
              class="form-control"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Fecha de Entrega</label>
            <input
              v-model="solicitudEditada.fechaEntrega"
              type="date"
              class="form-control"
            />
          </div>
          <div class="mb-2">
            <label class="form-label">Observaciones</label>
            <textarea
              v-model="solicitudEditada.observaciones"
              class="form-control"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-success" @click="guardarCambiosSolicitud">
            Guardar
          </button>
        </div>
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
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const centros = ref([]);
const solicitudes = ref([]);
const filtroCentro = ref("");
const paginaActual = ref(1);
const porPagina = 5;

const solicitudEditada = ref({});
const modal = ref(null);

const abrirModalEdicion = (solicitud) => {
  solicitudEditada.value = { ...solicitud };
  const modalElement = document.getElementById("modalEdicion");
  modal.value = new bootstrap.Modal(modalElement);
  modal.value.show();
};

const guardarCambiosSolicitud = async () => {
  try {
    const { id, ...datosActualizados } = solicitudEditada.value;
    await updateDoc(doc(db, "solicitudes", id), datosActualizados);
    console.log("[✅ Solicitud actualizada]", id);
    modal.value.hide();
    await cargarSolicitudes();
  } catch (error) {
    console.error("[❌ Error al actualizar solicitud]", error);
  }
};

const eliminarSolicitud = async (id) => {
  const confirmacion = confirm("¿Eliminar esta solicitud?");
  if (!confirmacion) return;

  try {
    await deleteDoc(doc(db, "solicitudes", id));
    console.log("[🗑️ Solicitud eliminada]", id);
    await cargarSolicitudes();
  } catch (error) {
    console.error("[❌ Error al eliminar solicitud]", error);
  }
};
const nombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);
  return centro ? centro.ubicacion : "Centro desconocido";
};

const cargarCentros = async () => {
  const snapshot = await getDocs(
    query(collection(db, "centros"), where("estatus", "==", "Activo"))
  );
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarSolicitudes = async () => {
  const snapshot = await getDocs(collection(db, "solicitudes"));
  solicitudes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));
};

const diasEntre = (inicio, fin) => {
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? "-" : diff;
};

const solicitudesFiltradas = computed(() => {
  const filtradas = filtroCentro.value
    ? solicitudes.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudes.value;
  const inicio = (paginaActual.value - 1) * porPagina;
  return filtradas.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  const filtradas = filtroCentro.value
    ? solicitudes.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudes.value;
  return Math.ceil(filtradas.length / porPagina);
});

onMounted(() => {
  cargarCentros();
  cargarSolicitudes();
});
</script>
