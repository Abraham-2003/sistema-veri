<template>
  <div class="p-3">
    <h6 class="text-center mb-3 text-success">Tacómetros</h6>

    <div v-for="linea in lineas" :key="linea" class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">
          Línea {{ linea }}
          <span v-if="linea === lineaDual" class="badge bg-primary ms-2"> Dual </span>
        </h6>

        <!-- Seleccionar todos (solo campos base) -->
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            :id="`selectAll-${linea}`"
            :checked="todosMarcados(linea)"
            @change="toggleLinea(linea)"
          />
          <label class="form-check-label" :for="`selectAll-${linea}`">
            Seleccionar todos
          </label>
        </div>

        <!-- Campos base -->
        <div v-for="campo in camposBase" :key="campo" class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            :id="`check-${linea}-${campo}`"
            v-model="localTacometros[linea][campo]"
          />
          <label class="form-check-label" :for="`check-${linea}-${campo}`">
            {{ campo }}
          </label>
        </div>

        <!-- Campos SOLO línea dual -->
        <div v-if="localTacometros[linea].especiales" class="border-top pt-3 mt-3">
          <div v-for="campo in camposLineaDual" :key="campo" class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              :id="`check-${linea}-especial-${campo}`"
              v-model="localTacometros[linea].especiales[campo]"
            />
            <label class="form-check-label" :for="`check-${linea}-especial-${campo}`">
              {{ campo }}
            </label>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="mt-3">
          <label class="form-label">Observaciones</label>
          <textarea
            v-model="localTacometros[linea].observaciones"
            class="form-control"
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="text-center mt-4">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto"
        @click="emitirSiguiente"
      >
        Finalizar <i class="bi bi-arrow-right-circle ms-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import Swal from "sweetalert2";

const props = defineProps({
  lineas: { type: Array, default: () => [] },
  lineaDual: { type: Number, default: null },
  modelValue: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:modelValue", "siguiente"]);

const camposBase = ["OBD", "Pinza", "Batería", "Contacto", "Encendedor"];
const camposLineaDual = ["Tacómetro óptico", "Termocopla"];

const localTacometros = ref({});

// Inicializar datos por línea
watch(
  () => [props.lineas, props.lineaDual],
  ([lineas, lineaDual]) => {
    if (!Array.isArray(lineas)) return;

    const nuevo = {};

    lineas.forEach((linea) => {
      nuevo[linea] = {
        observaciones: "",
      };

      // Campos base (todas las líneas)
      camposBase.forEach((campo) => {
        nuevo[linea][campo] = false;
      });

      // Campos EXTRA solo para línea dual
      if (linea === lineaDual) {
        nuevo[linea].especiales = {};
        camposLineaDual.forEach((campo) => {
          nuevo[linea].especiales[campo] = false;
        });
      } else {
        nuevo[linea].especiales = null;
      }
    });

    localTacometros.value = nuevo;
  },
  { immediate: true }
);

// Sincronizar con el padre
watch(
  localTacometros,
  (nuevo) => {
    emit("update:modelValue", nuevo);
  },
  { deep: true }
);

function todosMarcados(linea) {
  return camposBase.every(
    (campo) => localTacometros.value[linea]?.[campo]
  )
}

function toggleLinea(linea) {
  const estado = !todosMarcados(linea)
  camposBase.forEach((campo) => {
    localTacometros.value[linea][campo] = estado
  })
}


function emitirSiguiente() {
  emit("siguiente");
}
</script>
