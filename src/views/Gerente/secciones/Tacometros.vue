<template>
  <div>
    <h6 class="text-center mb-3 text-success">Tacómetros</h6>

    <div v-for="(linea, index) in lineas" :key="index" class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0">Línea {{ linea }}</h6>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              :id="`selectAll-${linea}`"
              :checked="todosMarcados(linea)"
              @change="toggleLinea(linea)"
            />
            <label class="form-check-label" :for="`selectAll-${linea}`">
              Seleccionar todas
            </label>
          </div>
        </div>

        <div v-for="campo in campos" :key="campo" class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            :id="`check-${linea}-${campo}`"
            v-model="datosTacometros[linea][campo]"
          />
          <label class="form-check-label" :for="`check-${linea}-${campo}`">
            {{ campo }}
          </label>
        </div>

        <div class="mb-2">
          <label class="form-label">Observaciones</label>
          <textarea
            v-model="datosTacometros[linea].observaciones"
            class="form-control"
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>

    <button class="btn btn-success w-100 mt-3" @click="emitirSiguiente">
      Finalizar →
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";

const props = defineProps({
  lineas: Array,
});

const emit = defineEmits(["siguiente"]);

const campos = ["OBD", "Pinza", "Batería", "Contacto", "Encendedor"];
const datosTacometros = ref({});
function todosMarcados(linea) {
  return campos.every((campo) => datosTacometros.value[linea]?.[campo]);
}

function toggleLinea(linea) {
  const estado = !todosMarcados(linea);
  campos.forEach((campo) => {
    datosTacometros.value[linea][campo] = estado;
  });
}

// Esperar a que props.lineas esté disponible
watch(
  () => props.lineas,
  (lineas) => {
    if (Array.isArray(lineas)) {
      lineas.forEach((linea) => {
        datosTacometros.value[linea] = { observaciones: "" };
        campos.forEach((campo) => {
          datosTacometros.value[linea][campo] = false;
        });
      });
      console.log("[✅ Tacómetros inicializados]", datosTacometros.value);
    } else {
      console.warn("[⚠️ props.lineas no es un array]", lineas);
    }
  },
  { immediate: true }
);
watch(
  datosTacometros,
  (nuevo) => {
    localStorage.setItem("tacometrosTemp", JSON.stringify(nuevo));
  },
  { deep: true }
);

function emitirSiguiente() {
  emit("siguiente", datosTacometros.value);
}
</script>
