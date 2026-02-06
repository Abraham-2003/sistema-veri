<template>
  <div>
    <h6 class="text-center mb-3 text-success">Gases</h6>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="tab in tabs" :key="tab">
        <button
          class="nav-link"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </li>
    </ul>

    <!-- Contenido según tab -->
    <div v-if="activeTab">
      <!-- En uso -->
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title">{{ activeTab }} - En uso</h6>
          <div
            v-for="(gas, index) in gasesUso[activeTab]"
            :key="`uso-${activeTab}-${index}`"
            class="mb-3 border-bottom pb-2"
          >
            <!-- Tipo ya no se edita -->
            <input type="hidden" v-model="gas.tipo" />
            <div class="mb-2">
              <label class="form-label">Serie</label>
              <input v-model="gas.serie" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">PSI</label>
              <input v-model="gas.psi" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Estatus</label>
              <select v-model="gas.estatus" class="form-select">
                <option disabled value="">Selecciona estatus</option>
                <option>En uso</option>
                <option>Agotado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- En stock -->
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title">{{ activeTab }} - En stock</h6>
          <div
            v-for="(gas, index) in gasesStock[activeTab]"
            :key="`stock-${activeTab}-${index}`"
            class="mb-3 border-bottom pb-2"
          >
            <!-- Tipo ya no se edita -->
            <input type="hidden" v-model="gas.tipo" />
            <div class="mb-2">
              <label class="form-label">Serie</label>
              <input v-model="gas.serie" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">PSI</label>
              <input v-model="gas.psi" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Estatus</label>
              <select v-model="gas.estatus" class="form-select">
                <option disabled value="">Selecciona estatus</option>
                <option>Lleno</option>
                <option>Agotado</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center">
      <!-- Botón siguiente -->
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
        @click="emitirSiguiente"
      >
        Imágenes <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ uso: {}, stock: {} }),
  },
});
const emit = defineEmits(["update:modelValue", "siguiente"]);

const tabs = ["Baja", "Media", "Cero"];
const activeTab = ref("Baja");

// Estado local inicial
const gasesUso = ref({
  Baja: [
    {
      tipo: "Baja - Uso",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
  Media: [
    {
      tipo: "Media - Uso",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
  Cero: [
    {
      tipo: "Cero - Uso",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
});

const gasesStock = ref({
  Baja: [
    {
      tipo: "Baja - Stock",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
  Media: [
    {
      tipo: "Media - Stock",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
  Cero: [
    {
      tipo: "Cero - Stock",
      serie: "",
      psi: "",
      estatus: "",
      reporte: "",
      observaciones: "",
    },
  ],
});

// Validación: todos los campos llenos
function validarTodosLosCampos() {
  return tabs.every((tab) => {
    const uso = gasesUso.value[tab];
    const stock = gasesStock.value[tab];
    return [...uso, ...stock].every(
      (gas) =>
        gas.serie.trim() !== "" &&
        gas.psi !== "" &&
        gas.psi !== null &&
        gas.psi !== undefined &&
        gas.estatus.trim() !== ""
    );
  });
}

function emitirSiguiente() {
  if (!validarTodosLosCampos()) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor llena todos los campos en todas las pestañas antes de continuar.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill",
      },
      buttonsStyling: false,
    });
    return;
  }

  // Emitir al padre con v-model
  emit("update:modelValue", { uso: gasesUso.value, stock: gasesStock.value });
  emit("siguiente");
}
</script>
