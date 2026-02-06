<script setup>
import { ref } from "vue";
import dayjs from "dayjs";

// Declarar la variable reactiva
const observaciones = ref("");

// Definir el evento que se emitirá al padre
const emit = defineEmits(["guardar"]);
const props = defineProps({
  enviando: {
    type: Boolean,
    default: false
  }
})


// Función que se llama al hacer clic en "Enviar"
function enviar() {
  if (props.enviando) return

  emit("guardar", {
    observaciones: observaciones.value,
    fecha: dayjs().format("YYYY-MM-DD")
  })
}

</script>

<template>
  <div>
    <h6 class="text-center text-success mb-3">Observaciones finales</h6>

    <textarea
      v-model="observaciones"
      class="form-control mb-3"
      rows="4"
      placeholder="Escribe tus observaciones aquí..."
    ></textarea>

    <button
      class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
      @click="enviar"
      :disabled="props.enviando"
    >
      <span v-if="!props.enviando"> Enviar reporte </span>

      <span v-else>
        <span class="spinner-border spinner-border-sm me-2"></span>
        Enviando...
      </span>
    </button>
  </div>
</template>
