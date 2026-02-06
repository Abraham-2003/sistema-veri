<template>
  <div>
    <h6 class="text-center mb-3 text-success">Calibraciones por línea</h6>

    <!-- Tarjetas por línea -->
    <div v-for="(linea, index) in lineas" :key="index" class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0">Línea {{ linea }}</h6>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              :id="`selectAll-${linea}`"
              :checked="todasSeleccionadas(linea)"
              @change="toggleLinea(linea)"
            />
            <label class="form-check-label" :for="`selectAll-${linea}`">
              Seleccionar todas
            </label>
          </div>
        </div>

        <div
          v-for="equipo in equiposPorLinea(linea)"
          :key="equipo"
          class="form-check mb-2"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :id="`check-${linea}-${equipo}`"
            v-model="localCalibraciones[linea][equipo]"
          />
          <label class="form-check-label" :for="`check-${linea}-${equipo}`">
            {{ equipo }}
          </label>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div class="mb-3">
      <label for="observacionesGenerales" class="form-label text-muted"
        >Observaciones generales</label
      >
      <textarea
        id="observacionesGenerales"
        class="form-control"
        rows="3"
        v-model="localObservaciones"
        placeholder="Escribe observaciones..."
      ></textarea>
    </div>

    <!-- Botón continuar -->
    <div class="text-center">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto"
        @click="emitirSiguiente"
      >
        Gases <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";

const props = defineProps({
  lineas: { type: Array, default: () => [] },
  lineaDual: { type: [String, Number], default: null },
  modelValue: { type: Object, default: () => ({ calibraciones: {}, observaciones: "" }) },
});

const emit = defineEmits(["update:modelValue", "siguiente"]);

const equipos = [
  "Analizador Gases",
  "Dinamómetros",
  "Fugas",
  "Comprobacion de gases",
  "Opacímetro",
];

function equiposPorLinea(linea) {
  return linea == props.lineaDual ? equipos : equipos.filter((e) => e !== "Opacímetro");
}

// Estado local para edición
const localCalibraciones = ref({});
const localObservaciones = ref("");

// Inicializar calibraciones por línea
watch(
  () => props.lineas,
  (lineas) => {
    if (Array.isArray(lineas) && lineas.length > 0) {
      localCalibraciones.value = {};
      lineas.forEach((linea) => {
        localCalibraciones.value[linea] = {};
        equiposPorLinea(linea).forEach((equipo) => {
          localCalibraciones.value[linea][equipo] = false;
        });
      });
      localObservaciones.value = "";
      console.log("[✅ Calibraciones inicializadas]", localCalibraciones.value);
    }
  },
  { immediate: true }
);

function todasSeleccionadas(linea) {
  return equiposPorLinea(linea).every(
    (equipo) => localCalibraciones.value[linea][equipo]
  );
}

function toggleLinea(linea) {
  const estado = !todasSeleccionadas(linea);
  equiposPorLinea(linea).forEach((equipo) => {
    localCalibraciones.value[linea][equipo] = estado;
  });
}

function emitirSiguiente() {
  // Validación simple
  const algunaSeleccionada = Object.values(localCalibraciones.value).some((equipos) =>
    Object.values(equipos).includes(true)
  );
  if (!algunaSeleccionada) {
    alert("Debes seleccionar al menos una calibración.");
    return;
  }

  emit("update:modelValue", localCalibraciones.value);
  emit("siguiente", localObservaciones.value);
}
</script>
