<template>
  <div class="container py-3">
    <h5 class="text-success fw-bold mb-3">Solicitudes pendientes</h5>

    <div v-if="solicitudesFiltradas.length === 0" class="text-muted text-center">
      No hay solicitudes registradas.
    </div>
    <button class="btn btn-success w-100 mb-3" @click="abrirModalRegistro">
      Registrar nueva solicitud
    </button>
    <div class="d-flex flex-column gap-3">
      <div
        v-for="sol in solicitudesFiltradas"
        :key="sol.id"
        class="card shadow-sm solicitud-card"
        @click="abrirModal(sol)"
      >
        <div class="card-body">
          <h6 class="fw-bold">{{ sol.tipo }} - {{ sol.elemento }}</h6>
          <p class="mb-1 small">Proveedor: {{ sol.proveedor }}</p>
          <p class="mb-1 small">Fecha de solicitud: {{ sol.fechaSolicitud }}</p>
          <span
            class="badge"
            :class="sol.estatus === 'Pendiente' ? 'bg-warning' : 'bg-success'"
          >
            {{ sol.estatus }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="modalRegistro" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registrar Solicitud</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <!-- Tipo -->
            <label class="form-label">Tipo</label>
            <select v-model="solicitud.tipo" class="form-select mb-2">
              <option disabled value="">Seleccione una opción</option>
              <option value="insumo">Insumo</option>
              <option value="servicio">Servicio</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>

            <!-- Elemento -->
            <label class="form-label">Elemento</label>
            <input
              v-model="solicitud.elemento"
              type="text"
              class="form-control mb-2"
              placeholder="Ej. Cilindro, equipo, etc."
            />

            <!-- Proveedor o laboratorio -->
            <div class="mb-3">
              <label class="form-label">Proveedor o Laboratorio</label>
              <select v-model="solicitud.proveedor" class="form-select">
                <option disabled value="">Selecciona proveedor o laboratorio</option>

                <optgroup label="Proveedores">
                  <option v-for="p in proveedores" :key="p.id" :value="p.nombre">
                    {{ p.nombre }}
                  </option>
                </optgroup>

                <optgroup label="Laboratorios">
                  <option v-for="l in laboratorios" :key="l.id" :value="l.nombre">
                    {{ l.nombre }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Fecha de solicitud -->
            <label class="form-label">Fecha de Solicitud</label>
            <input
              v-model="solicitud.fechaSolicitud"
              type="date"
              class="form-control mb-2"
            />

            <!-- Fecha de pago -->
            <label class="form-label">Fecha de Pago</label>
            <input v-model="solicitud.fechaPago" type="date" class="form-control mb-2" />

            <!-- Observaciones -->
            <label class="form-label">Observaciones</label>
            <textarea
              v-model="solicitud.observaciones"
              class="form-control mb-2"
              placeholder="Escribe observaciones..."
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" @click="guardarSolicitud">
              Guardar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="modalSolicitud" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la Solicitud</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p><strong>Tipo:</strong> {{ solicitudSeleccionada.tipo }}</p>
            <p><strong>Elemento:</strong> {{ solicitudSeleccionada.elemento }}</p>
            <p><strong>Proveedor:</strong> {{ solicitudSeleccionada.proveedor }}</p>
            <p>
              <strong>Fecha de Solicitud:</strong>
              {{ solicitudSeleccionada.fechaSolicitud }}
            </p>
            <p><strong>Fecha de Pago:</strong> {{ solicitudSeleccionada.fechaPago }}</p>
            <p>
              <strong>Observaciones:</strong> {{ solicitudSeleccionada.observaciones }}
            </p>

            <div v-if="solicitudSeleccionada.estatus === 'Pendiente'" class="mt-3">
              <label class="form-label">Fecha de Entrega</label>
              <input type="date" v-model="fechaEntrega" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button
              v-if="solicitudSeleccionada.estatus === 'Pendiente'"
              class="btn btn-success"
              @click="marcarEntregada"
            >
              Marcar como entregada
            </button>
          </div>
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
  addDoc,
  getFirestore,
  updateDoc,
  doc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const modalRegistro = ref(null);

const abrirModalRegistro = () => {
  const modalElement = document.getElementById("modalRegistro");
  modalRegistro.value = new bootstrap.Modal(modalElement);
  modalRegistro.value.show();
};

const solicitudes = ref([]);
const solicitudSeleccionada = ref({});
const fechaEntrega = ref("");
const modal = ref(null);
const user = ref(JSON.parse(localStorage.getItem("user")) || {});
const solicitudesFiltradas = computed(() =>
  solicitudes.value.filter(
    (s) => s.estatus === "Pendiente" && s.centroId === user.value.centroId
  )
);

const cargarSolicitudes = async () => {
  const snapshot = await getDocs(collection(db, "solicitudes"));
  solicitudes.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
const solicitud = ref({
  tipo: "",
  elemento: "",
  proveedor: "",
  fechaSolicitud: "",
  fechaPago: "",
  fechaEntrega: "",
  observaciones: "",
  centroId: "",
  estatus: "Pendiente",
});

const abrirModal = (solicitud) => {
  solicitudSeleccionada.value = { ...solicitud };
  fechaEntrega.value = "";
  const modalElement = document.getElementById("modalSolicitud");
  modal.value = new bootstrap.Modal(modalElement);
  modal.value.show();
};
const proveedores = ref([]);
const laboratorios = ref([]);
const cargarLaboratorios = async () => {
  try {
    const snapshot = await getDocs(collection(db, "laboratorios"));
    laboratorios.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("[✅ Laboratorios cargados]", laboratorios.value);
  } catch (err) {
    console.error("[❌ Error al cargar laboratorios]", err);
  }
};
const cargarProveedores = async () => {
  try {
    const snapshot = await getDocs(collection(db, "proveedores"));
    proveedores.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log("[✅ Proveedores cargados]", proveedores.value);
  } catch (err) {
    console.error("[❌ Error al cargar proveedores]", err);
  }
};
const marcarEntregada = async () => {
  if (!fechaEntrega.value) return alert("Selecciona una fecha de entrega");

  try {
    await updateDoc(doc(db, "solicitudes", solicitudSeleccionada.value.id), {
      fechaEntrega: fechaEntrega.value,
      estatus: "Finalizado",
    });

    alert("Solicitud marcada como entregada");

    modal.value.hide(); // Cierra el modal

    await cargarSolicitudes(); // Recarga la lista

    fechaEntrega.value = "";
    solicitudSeleccionada.value = {};
  } catch (err) {
    console.error("[❌ Error al marcar como entregada]", err);
    alert("No se pudo actualizar la solicitud");
  }
};

const guardarSolicitud = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  solicitud.value.centroId = user?.centroId || null;

  try {
    await addDoc(collection(db, "solicitudes"), solicitud.value);
    console.log("[✅ Solicitud registrada]", solicitud.value);
    alert("Solicitud guardada correctamente");

    // Cerrar modal
    modalRegistro.value.hide();

    // Recargar solicitudes
    await cargarSolicitudes();

    // Limpiar formulario
    solicitud.value = {
      tipo: "",
      elemento: "",
      proveedor: "",
      fechaSolicitud: "",
      fechaPago: "",
      fechaEntrega: "",
      observaciones: "",
      centroId: "",
      estatus: "Pendiente",
    };
  } catch (err) {
    console.error("[❌ Error al guardar solicitud]", err);
    alert("Hubo un error al guardar la solicitud");
  }
};

onMounted(() => {
  cargarProveedores();
  cargarLaboratorios();
  cargarSolicitudes();
});
</script>

<style>
.solicitud-card {
  border-radius: 12px;
  transition: box-shadow 0.3s ease;
}
.solicitud-card:hover {
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
}
</style>
