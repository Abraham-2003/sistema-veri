<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Histórico de Solicitudes</h3>
    </div>

    <!-- Filtro -->
    <div class="row mb-3">
      <div class="col-md-4">
        <select v-model="filtroCentro" class="form-select form-select-sm">
          <option value="">Todos los centros activos</option>
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
            <th>Centro</th>
            <th>Tipo</th>
            <th>Elemento</th>
            <th class="d-none d-lg-table-cell">Proveedor</th>
            <th>Solicitud</th>
            <th class="d-none d-md-table-cell">Pago</th>
            <th class="d-none d-md-table-cell">Entrega</th>
            <th class="d-none d-xl-table-cell">Observaciones</th>
            <th>Estatus</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="sol in solicitudesFiltradas"
            :key="sol.id"
            @click="abrirModalEdicion(sol)"
          >
            <td class="fw-medium cell-indicador">
              <span v-if="!sol.leida" class="indicador-no-leido"></span>

              {{ nombreCentro(sol.centroId) }}
            </td>
            <td>
              <span class="type-pill">{{ sol.tipo }}</span>
            </td>

            <td>{{ sol.elemento }}</td>

            <td class="d-none d-lg-table-cell">
              {{ sol.proveedor }}
            </td>

            <td class="text-muted small">
              {{ sol.fechaSolicitud }}
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ sol.fechaPago || "—" }}
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ sol.fechaEntrega || "—" }}
            </td>

            <td class="d-none d-xl-table-cell text-truncate obs-cell">
              {{ sol.observaciones || "—" }}
            </td>

            <td>
              <span
                class="status-pill"
                :class="sol.estatus === 'Pendiente' ? 'pending' : 'done'"
              >
                {{ sol.estatus }}
              </span>
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <button
                  class="btn btn-light btn-sm"
                  @click="abrirModalEdicion(sol)"
                  title="Editar"
                >
                  <i class="bi bi-pencil-square"></i>
                </button>

                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarSolicitud(sol.id)"
                  title="Eliminar"
                >
                  <i class="bi bi-trash"></i>
                </button>

                <a
                  :href="generarLinkWhatsApp(sol)"
                  target="_blank"
                  class="btn btn-light btn-sm text-success"
                  title="Enviar WhatsApp"
                >
                  <i class="bi bi-whatsapp"></i>
                </a>
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
  </div>

  <!-- Modal Edición -->
  <div class="modal fade" id="modalEdicion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar Solicitud</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="mb-2">
            <label class="form-label small">Tipo</label>
            <input
              v-model="solicitudEditada.tipo"
              type="text"
              class="form-control form-control-sm"
            />
          </div>

          <div class="mb-2">
            <label class="form-label small">Proveedor</label>
            <input
              v-model="solicitudEditada.proveedor"
              type="text"
              class="form-control form-control-sm"
            />
          </div>

          <div class="mb-2">
            <label class="form-label small">Fecha de Solicitud</label>
            <input
              v-model="solicitudEditada.fechaSolicitud"
              type="date"
              class="form-control form-control-sm"
            />
          </div>

          <div class="mb-2">
            <label class="form-label small">Fecha de Pago</label>
            <input
              v-model="solicitudEditada.fechaPago"
              type="date"
              class="form-control form-control-sm"
            />
          </div>

          <div class="mb-2">
            <label class="form-label small">Fecha de Entrega</label>
            <input
              v-model="solicitudEditada.fechaEntrega"
              type="date"
              class="form-control form-control-sm"
            />
          </div>

          <div class="mb-2">
            <label class="form-label small">Observaciones</label>
            <textarea
              v-model="solicitudEditada.observaciones"
              class="form-control form-control-sm"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="solicitudEditada.estatus === 'Pendiente'"
            class="btn btn-outline-success btn-sm me-auto"
            @click="finalizarSolicitud"
          >
            Marcar como finalizada
          </button>

          <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
            Cancelar
          </button>
          <button class="btn btn-success btn-sm" @click="guardarCambiosSolicitud">
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
const porPagina = 15;

const solicitudEditada = ref({});
const modal = ref(null);

const abrirModalEdicion = (solicitud) => {
  solicitudEditada.value = { ...solicitud };

  const modalElement = document.getElementById("modalEdicion");
  modal.value = new bootstrap.Modal(modalElement);

  modalElement.addEventListener(
    "hidden.bs.modal",
    async () => {
      if (!solicitud.leida) {
        await updateDoc(doc(db, "solicitudes", solicitud.id), {
          leida: true
        });

        const index = solicitudes.value.findIndex(s => s.id === solicitud.id);
        if (index !== -1) {
          solicitudes.value[index].leida = true;
        }
      }
    },
    { once: true }
  );

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
const solicitudesOrdenadas = computed(() => {
  return [...solicitudes.value].sort((a, b) => {
    if (a.estatus === "Pendiente" && b.estatus !== "Pendiente") return -1;
    if (a.estatus !== "Pendiente" && b.estatus === "Pendiente") return 1;
    return new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud);
  });
});

const solicitudesFiltradas = computed(() => {
  const base = filtroCentro.value
    ? solicitudesOrdenadas.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudesOrdenadas.value;

  const inicio = (paginaActual.value - 1) * porPagina;
  return base.slice(inicio, inicio + porPagina);
});

const totalPaginas = computed(() => {
  const filtradas = filtroCentro.value
    ? solicitudes.value.filter((s) => s.centroId === filtroCentro.value)
    : solicitudes.value;
  return Math.ceil(filtradas.length / porPagina);
});
const finalizarSolicitud = async () => {
  try {
    await updateDoc(doc(db, "solicitudes", solicitudEditada.value.id), {
      estatus: "Finalizado",
    });

    modal.value.hide();
    await cargarSolicitudes();
  } catch (error) {
    console.error("Error al finalizar solicitud", error);
  }
};

const generarMensajeWhatsApp = (sol) => {
  if (!sol) return "⚠️ Solicitud no disponible";

  return (
    `*Solicitud de ${sol.tipo}*\n\n` +
    `*Centro:* ${nombreCentro(sol.centroId)}\n` +
    `*Elemento:* ${sol.elemento}\n` +
    `*Proveedor:* ${sol.proveedor}\n` +
    `*Fecha de solicitud:* ${sol.fechaSolicitud || "N/A"}\n` +
    `*Fecha de pago:* ${sol.fechaPago || "N/A"}\n` +
    `*Fecha de entrega:* ${sol.fechaEntrega || "N/A"}\n` +
    `*Observaciones:* ${sol.observaciones || "Sin observaciones"}\n` +
    `*Estatus:* ${sol.estatus}`
  );
};

const generarLinkWhatsApp = (sol) => {
  const mensaje = generarMensajeWhatsApp(sol);
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
};

onMounted(() => {
  cargarCentros();
  cargarSolicitudes();
});
</script>
<style scoped>
/* Base tabla corporativa */
.infra-table {
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
  cursor:pointer;
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

/* Tipo */
.type-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: #eef1f4;
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

/* Estatus */
.status-pill {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pill.pending {
  background: #fff3cd;
  color: #856404;
}

.status-pill.done {
  background: #e6f4ea;
  color: #198754;
}

/* Observaciones */
.obs-cell {
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

.cell-indicador {
  position: relative;
  padding-left: 12px !important;
}

.indicador-no-leido {
  position: absolute;
  left: 0;
  top: 10%;
  height: 80%;
  width: 3px;
  background-color: #0d6efd;
  border-radius: 1px;
}

</style>
