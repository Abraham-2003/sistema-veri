<template>
  <div>
    <h6 class="text-center mb-3 text-success">Gases</h6>

    <!-- Gases en uso -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Gases en uso</h6>

        <div
          v-for="(gas, index) in gasesUso"
          :key="'uso-' + index"
          class="mb-3 border-bottom pb-2"
        >
          <div class="mb-2">
            <label class="form-label">Tipo</label>
            <input v-model="gas.tipo" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Serie</label>
            <input v-model="gas.serie" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">PSI</label>
            <input v-model="gas.psi" type="number" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Estatus</label>
            <select v-model="gas.estatus" class="form-select">
              <option disabled value="">Selecciona estatus</option>
              <option value="Lleno">Lleno</option>
              <option value="Agotado">Agotado</option>
            </select>
          </div>

          <div class="mb-2">
            <label class="form-label">#Reporte</label>
            <input v-model="gas.reporte" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Observaciones</label>
            <textarea
              v-model="gas.observaciones"
              class="form-control"
              rows="2"
            ></textarea>
          </div>
        </div>

        <button class="btn btn-outline-success w-100" @click="agregarGasUso">
          + Agregar gas en uso
        </button>
      </div>
    </div>

    <!-- Gases en stock -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Gases en stock</h6>

        <div
          v-for="(gas, index) in gasesStock"
          :key="'stock-' + index"
          class="mb-3 border-bottom pb-2"
        >
          <div class="mb-2">
            <label class="form-label">Tipo</label>
            <input v-model="gas.tipo" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Serie</label>
            <input v-model="gas.serie" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">PSI</label>
            <input v-model="gas.psi" type="number" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Estatus</label>
            <select v-model="gas.estatus" class="form-select">
              <option disabled value="">Selecciona estatus</option>
              <option value="Lleno">Lleno</option>
              <option value="Agotado">Agotado</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label">#Reporte</label>
            <input v-model="gas.reporte" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label">Observaciones</label>
            <textarea
              v-model="gas.observaciones"
              class="form-control"
              rows="2"
            ></textarea>
          </div>
        </div>

        <button class="btn btn-outline-success w-100" @click="agregarGasStock">
          + Agregar gas en stock
        </button>
      </div>
    </div>

    <!-- Botón siguiente -->
    <button class="btn btn-success w-100 mt-3" @click="emitirSiguiente">
      Compresor →
    </button>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch } from "vue";

const emit = defineEmits(["siguiente"]);

const gasesUso = ref([
  { tipo: "", serie: "", psi: "", estatus: "", reporte: "", observaciones: "" },
]);

const gasesStock = ref([
  { tipo: "", serie: "", psi: "", estatus: "", reporte: "", observaciones: "" },
]);

function agregarGasUso() {
  gasesUso.value.push({
    tipo: "",
    serie: "",
    psi: "",
    estatus: "",
    reporte: "",
    observaciones: "",
  });
}

function agregarGasStock() {
  gasesStock.value.push({
    tipo: "",
    serie: "",
    psi: "",
    estatus: "",
    reporte: "",
    observaciones: "",
  });
}
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
  localStorage.setItem("gasesUsoTemp", JSON.stringify(gasesUso.value));
  localStorage.setItem("gasesStockTemp", JSON.stringify(gasesStock.value));

  emit("siguiente", {
    gasesUso: gasesUso.value,
    gasesStock: gasesStock.value,
  });
}
</script>
