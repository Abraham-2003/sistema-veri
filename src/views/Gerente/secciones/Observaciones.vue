<script setup>
import { ref } from "vue";
import dayjs from "dayjs";

const observaciones = ref("");
const nombreencargado = ref("");

const emit = defineEmits(["guardar"]);

const props = defineProps({
  enviando: {
    type: Boolean,
    default: false
  }
});

function enviar() {
  if (props.enviando) return;

  // Validar nombre del responsable
  if (!nombreencargado.value.trim()) {
    alert("Debes ingresar el nombre del responsable.");
    return;
  }

  emit("guardar", {
    observaciones: observaciones.value,
    nombreencargado: nombreencargado.value.trim(),
    fecha: dayjs().format("YYYY-MM-DD")
  });
}
</script>

<template>
  <div>
    <h6 class="text-center text-success mb-3">
      Observaciones finales
    </h6>

    <textarea
      v-model="observaciones"
      class="form-control mb-3"
      rows="4"
      placeholder="Escribe tus observaciones aquí..."
    ></textarea>

    <div class="mb-2">
      <label class="form-label">
        Nombre de responsable <span class="text-danger">*</span>
      </label>

      <input
        v-model="nombreencargado"
        class="form-control"
        type="text"
        placeholder="Ingresa el nombre del responsable"
      />
    </div>

    <button
      class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
      @click="enviar"
      :disabled="props.enviando"
    >
      <span v-if="!props.enviando">
        Enviar reporte
      </span>

      <span v-else>
        <span class="spinner-border spinner-border-sm me-2"></span>
        Enviando...
      </span>
    </button>
  </div>
</template>