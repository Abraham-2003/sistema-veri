<template>
  <div class="container-fluid px-3 py-2">
    <h5 class="text-center mb-3 text-success">Infraestructura registrada</h5>

    <div v-if="loading" class="text-center">
      <div class="spinner-border text-success" role="status"></div>
    </div>

    <div v-else-if="infraestructura.length === 0" class="alert alert-warning text-center">
      No hay infraestructura registrada para tu centro.
    </div>

    <div v-else>
      <div v-for="item in infraestructura" :key="item.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title fw-bold">{{ item.elemento }}</h6>
          <p class="mb-1"><strong>Estatus:</strong> {{ item.estatus }}</p>
          <p class="mb-2">
            <strong>Observaciones:</strong>
            {{ item.observaciones || "Sin observaciones" }}
          </p>
          <button class="btn btn-outline-success w-100" @click="editar(item)">
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de edición -->
    <div
      class="modal fade"
      id="modalEditarInfra"
      tabindex="-1"
      aria-labelledby="modalEditarInfraLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="modalEditarInfraLabel">Editar infraestructura</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Cerrar"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Elemento</label>
              <input
                v-model="infraActual.elemento"
                type="text"
                class="form-control"
                disabled
              />
            </div>
            <div v-if="infraActual.areas.length" class="mb-3">
              <label class="form-label">Áreas con falla</label>
              <div
                v-for="(area, index) in infraActual.areas"
                :key="index"
                class="form-check"
              >
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'area-' + index"
                  :value="area"
                  v-model="infraActual.areasConFalla"
                />
                <label class="form-check-label" :for="'area-' + index">{{ area }}</label>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Estatus</label>
              <select v-model="infraActual.estatus" class="form-select">
                <option value="Operativo">Operativo</option>
                <option value="Fuera de servicio">Fuera de servicio</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Observaciones</label>
              <textarea
                v-model="infraActual.observaciones"
                class="form-control"
                rows="3"
                placeholder="Escribe observaciones..."
              ></textarea>
            </div>
            <div v-if="infraActual.estatus === 'Fuera de servicio'" class="mb-3">
              <label class="form-label fw-semibold"> Proveedor </label>

              <select
                v-model="infraActual.proveedor"
                class="form-select form-select-lg shadow-sm"
              >
                <option disabled value="">
                  {{
                    cargandoProveedores
                      ? "Cargando proveedores..."
                      : "Selecciona proveedor"
                  }}
                </option>

                <option v-for="(prov, index) in proveedores" :key="index" :value="prov">
                  {{ prov }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-success" @click="guardarCambios">
              {{
                infraActual.estatus === "Fuera de servicio"
                  ? "Guardar y generar solicitud"
                  : "Guardar"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const db = getFirestore();
const infraestructura = ref([]);
const loading = ref(true);
const infraActual = ref({
  id: "",
  elemento: "",
  estatus: "",
  observaciones: "",
  areas: "",
  areasConFalla: "",
  proveedor: "",
});
const proveedores = ref([]);
const cargandoProveedores = ref(false);

async function cargarProveedores() {
  try {
    cargandoProveedores.value = true;

    const snap = await getDocs(collection(db, "proveedores"));

    proveedores.value = snap.docs.map((doc) => doc.data().nombre);
  } catch (error) {
    console.error("Error cargando proveedores:", error);
  } finally {
    cargandoProveedores.value = false;
  }
}

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("[👤 Usuario logueado]", user);

  const centroId = user?.centroId || user?.idCentro || null;
  console.log("[🏢 Centro ID detectado]", centroId);

  if (!centroId) {
    console.warn("[⚠️ No se encontró centroId en el usuario]");
    loading.value = false;
    return;
  }

  try {
    const q = query(collection(db, "infraestructura"), where("centroId", "==", centroId));

    console.log("[🔍 Ejecutando consulta a Firestore...]");
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("[📭 No hay infraestructura registrada para este centro]");
    }

    infraestructura.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("[✅ Infraestructura cargada]", infraestructura.value);
  } catch (err) {
    console.error("[❌ Error al consultar infraestructura]", err);
  } finally {
    loading.value = false;
  }
  await cargarProveedores();
});

function editar(item) {
  infraActual.value = {
    id: item.id,
    elemento: item.elemento,
    estatus: item.estatus,
    observaciones: item.observaciones,
    areas: item.areas || [],
    areasConFalla: item.areasConFalla || [],
  };

  const modal = new bootstrap.Modal(document.getElementById("modalEditarInfra"));
  modal.show();
}

async function guardarCambios() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const centroId = user?.centroId || user?.idCentro || null;

    if (!centroId) return;

    // Validación extra
    if (
      infraActual.value.estatus === "Fuera de servicio" &&
      !infraActual.value.proveedor
    ) {
      alert("Debes capturar el proveedor para generar la solicitud.");
      return;
    }

    // 1️⃣ Actualizar infraestructura
    const docRef = doc(db, "infraestructura", infraActual.value.id);

    await updateDoc(docRef, {
      estatus: infraActual.value.estatus,
      observaciones: infraActual.value.observaciones,
      areasConFalla: infraActual.value.areasConFalla,
    });

    const index = infraestructura.value.findIndex(
      (i) => i.id === infraActual.value.id
    );
    if (index !== -1)
      infraestructura.value[index] = { ...infraActual.value };

    if (infraActual.value.estatus === "Fuera de servicio") {
      const hoy = new Date().toISOString().split("T")[0];

      await addDoc(collection(db, "solicitudes"), {
        centroId: centroId,
        tipo: "Infraestructura",
        elemento: infraActual.value.elemento,
        proveedor: infraActual.value.proveedor,
        fechaSolicitud: hoy,
        fechaPago: "",
        fechaEntrega: "",
        observaciones: infraActual.value.observaciones || "",
        estatus: "Pendiente",
        leida: false,
      });
    }

    bootstrap.Modal.getInstance(
      document.getElementById("modalEditarInfra")
    ).hide();

  } catch (err) {
    console.error("Error:", err);
  }
}
</script>
