<template>
  <div class="container-fluid px-3 py-3">
    <h5 class="text-center text-success mb-4">Registrar Solicitud</h5>

    <!-- Sección 1: Datos iniciales -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Datos de la solicitud</h6>

        <div class="mb-3">
          <label class="form-label">Tipo</label>
          <input
            v-model="solicitud.tipo"
            type="text"
            class="form-control"
            placeholder="Ej. Mantenimiento de cilindro"
          />
        </div>

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

        <div class="mb-3">
          <label class="form-label">Fecha de Solicitud</label>
          <input v-model="solicitud.fechaSolicitud" type="date" class="form-control" />
        </div>
      </div>
    </div>

    <!-- Sección 2: Fecha de pago -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Información de pago</h6>

        <div class="mb-3">
          <label class="form-label">Fecha de Pago</label>
          <input v-model="solicitud.fechaPago" type="date" class="form-control" />
        </div>
      </div>
    </div>

    <!-- Sección 3: Fecha de entrega -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Información de entrega</h6>

        <div class="mb-3">
          <label class="form-label">Fecha de Entrega</label>
          <input v-model="solicitud.fechaEntrega" type="date" class="form-control" />
        </div>
      </div>
    </div>

    <!-- Sección 4: Observaciones -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Observaciones</h6>

        <textarea
          v-model="solicitud.observaciones"
          class="form-control"
          rows="3"
          placeholder="Escribe observaciones..."
        ></textarea>
      </div>
    </div>

    <!-- Botón de guardar -->
    <button class="btn btn-success w-100" @click="guardarSolicitud">
      Guardar Solicitud
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { collection, getDocs, addDoc, getFirestore } from "firebase/firestore";

const proveedores = ref([]);
const laboratorios = ref([])

const cargarLaboratorios = async () => {
  try {
    const snapshot = await getDocs(collection(db, "laboratorios"))
    laboratorios.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log("[✅ Laboratorios cargados]", laboratorios.value)
  } catch (err) {
    console.error("[❌ Error al cargar laboratorios]", err)
  }
}

const cargarProveedores = async () => {
  try {
    const snapshot = await getDocs(collection(db, "proveedores"));
    proveedores.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("[✅ Proveedores cargados]", proveedores.value);
  } catch (err) {
    console.error("[❌ Error al cargar proveedores]", err);
  }
};

const db = getFirestore();
const solicitud = ref({
  tipo: "",
  proveedor: "",
  fechaSolicitud: "",
  fechaPago: "",
  fechaEntrega: "",
  observaciones: "",
  centroId: "",
});

const guardarSolicitud = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  solicitud.value.centroId = user?.centroId || null;

  try {
    await addDoc(collection(db, "solicitudes"), solicitud.value);
    console.log("[✅ Solicitud registrada]", solicitud.value);
    alert("Solicitud guardada correctamente");
    solicitud.value = {
      tipo: "",
      proveedor: "",
      fechaSolicitud: "",
      fechaPago: "",
      fechaEntrega: "",
      observaciones: "",
      centroId: "",
    };
  } catch (err) {
    console.error("[❌ Error al guardar solicitud]", err);
    alert("Hubo un error al guardar la solicitud");
  }
};
onMounted(() => {
  cargarProveedores();
  cargarLaboratorios()
});
</script>
