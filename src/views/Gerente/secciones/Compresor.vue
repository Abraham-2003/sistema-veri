<template>
  <div>
    <h6 class="text-center mb-3 text-success">Compresor</h6>

    <div class="card shadow-sm">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Serie</label>
          <input
            v-model="compresor.serie"
            type="text"
            class="form-control"
            placeholder="Ej. CMP-2023-001"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Nivel de aceite (%)</label>
          <input
            v-model="compresor.nivelAceite"
            type="number"
            class="form-control"
            placeholder="Ej. 75"
            min="0"
            max="100"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Estatus</label>
          <select v-model="compresor.estatus" class="form-select">
            <option disabled value="">Selecciona estatus</option>
            <option value="Operativo">Operativo</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
            <option value="Apagado">Apagado</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Limpieza</label>
          <select v-model="compresor.limpieza" class="form-select">
            <option disabled value="">Selecciona limpieza</option>
            <option value="Limpio">Limpio</option>
            <option value="Sucio">Sucio</option>
            <option value="No aplica">No aplica</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea
            v-model="compresor.observaciones"
            class="form-control"
            rows="3"
            placeholder="Escribe observaciones..."
          ></textarea>
        </div>
      </div>
    </div>

    <button class="btn btn-success w-100 mt-3" @click="emitirSiguiente">
      Funcionamiento de líneas →
    </button>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch } from "vue";

const emit = defineEmits(["siguiente"]);

const compresor = ref({
  serie: "",
  nivelAceite: "",
  estatus: "",
  limpieza: "",
  observaciones: "",
});
watch(
  compresor,
  (nuevo) => {
    localStorage.setItem("compresorTemp", JSON.stringify(nuevo));
  },
  { deep: true }
);

function emitirSiguiente() {
  emit("siguiente", compresor.value);
}
</script>
