<template>
  <div class="p-3">
    <h6 class="text-center mb-3 text-success">
      Funcionamiento de líneas
    </h6>

    <div
      v-for="linea in lineas"
:key="linea"

      class="card mb-3 shadow-sm"
    >
      <div class="card-body">
        <h6 class="card-title">
          Línea {{ linea }}
          <span
            v-if="linea === lineaDual"
            class="badge bg-primary ms-2"
          >
            Dual
          </span>
        </h6>

        <!-- Estado de la línea -->
        <div class="mb-3">
          <label class="form-label">Estado</label>
          <select
            v-model="localLineas[linea].estado"
            class="form-select"
          >
            <option disabled value="">Selecciona estado</option>
            <option value="Operativa">Operativa</option>
            <option value="Apagada">Apagada</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
          </select>
        </div>

        <!-- Reporte de falla -->
        <div class="mb-3">
          <label class="form-label">Reporte de falla</label>
          <input
            v-model="localLineas[linea].reporteFalla"
            type="text"
            class="form-control"
            placeholder="Ej. Falla en sensor de opacidad"
          />
        </div>

        <!-- Número de reporte -->
        <div class="mb-3">
          <label class="form-label">#Reporte</label>
          <input
            v-model="localLineas[linea].numeroReporte"
            type="text"
            class="form-control"
            placeholder="Ej. RPT-2025-001"
          />
        </div>

        <!-- Opacímetro SOLO para línea dual -->
        <div
          v-if="localLineas[linea].opacimetro"
          class="mb-3 border-top pt-3"
        >
          <label class="form-label text-primary fw-semibold">
            Estado del Opacímetro (Línea Dual)
          </label>

          <select
            v-model="localLineas[linea].opacimetro.estado"
            class="form-select"
          >
            <option disabled value="">Selecciona estado</option>
            <option value="Operativo">Operativo</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
            <option value="En mantenimiento">En mantenimiento</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Botón siguiente -->
    <div class="text-center">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto"
        @click="emitirSiguiente"
      >
        Tacómetros
        <i class="bi bi-arrow-right-circle ms-2"></i>
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

const localLineas = ref({});

// Inicializar datos por línea
watch(
  () => [props.lineas, props.lineaDual],
  ([lineas, lineaDual]) => {
    if (!Array.isArray(lineas)) return

    const nuevo = {}

    lineas.forEach((linea) => {
      nuevo[linea] = {
        estado: "",
        reporteFalla: "",
        numeroReporte: "",
        opacimetro: linea === lineaDual ? { estado: "" } : null
      }
    })

    localLineas.value = nuevo
  },
  { immediate: true }
)


// Sincronizar con el padre
watch(
  localLineas,
  (nuevo) => {
    emit("update:modelValue", nuevo);
  },
  { deep: true }
);

function validarLineas() {
  return props.lineas.every((linea) => {
    const datos = localLineas.value[linea];

    if (!datos.estado.trim()) return false;

    // Si es línea dual, validar opacímetro
    if (linea === props.lineaDual) {
      return datos.opacimetro?.estado?.trim() !== "";
    }

    return true;
  });
}

function emitirSiguiente() {
  if (!validarLineas()) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor llena el estatus en todas las líneas antes de continuar.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill",
      },
      buttonsStyling: false,
    });
    return;
  }

  emit("siguiente");
}
</script>
