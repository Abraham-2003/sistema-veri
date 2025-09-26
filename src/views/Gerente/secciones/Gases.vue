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
        Compresor <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch } from "vue";
import Swal from "sweetalert2";

const emit = defineEmits(["siguiente"]);
const tabs = ["Baja", "Media", "Cero"];
const activeTab = ref("Baja");

// Estructura organizada por tipo
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

function validarTodosLosCampos() {
  const todasLasTabs = tabs;

  return todasLasTabs.every((tab) => {
    const uso = gasesUso.value[tab];
    const stock = gasesStock.value[tab];

    const todosLlenos = [...uso, ...stock].every((gas) => {
      return gas.serie.trim() !== "" && gas.psi !== "" && gas.estatus.trim() !== "";
    });

    return todosLlenos;
  });
}

// Guardado en localStorage
watch(
  gasesUso,
  (nuevo) => {
    localStorage.setItem("gasesUsoTemp", JSON.stringify(nuevo));
  },
  { deep: true }
);

watch(
  gasesStock,
  (nuevo) => {
    localStorage.setItem("gasesStockTemp", JSON.stringify(nuevo));
  },
  { deep: true }
);

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

  localStorage.setItem("gasesUsoTemp", JSON.stringify(gasesUso.value));
  localStorage.setItem("gasesStockTemp", JSON.stringify(gasesStock.value));

  emit("siguiente", {
    gasesUso: gasesUso.value,
    gasesStock: gasesStock.value,
  });
}
</script>
