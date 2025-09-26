<template>
  <div>
    <h6 class="text-center mb-3 text-success">Funcionamiento de líneas</h6>

    <div v-for="(linea, index) in lineas" :key="index" class="card mb-3 shadow-sm">
      <div class="card-body">
        <h6 class="card-title">Línea {{ linea }}</h6>

        <div class="mb-3">
          <label class="form-label">Estado</label>
          <select v-model="datosLineas[linea].estado" class="form-select">
            <option disabled value="">Selecciona estado</option>
            <option value="Operativa">Operativa</option>
            <option value="Apagada">Apagada</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Reporte de falla</label>
          <input
            v-model="datosLineas[linea].reporteFalla"
            type="text"
            class="form-control"
            placeholder="Ej. Falla en sensor de opacidad"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">#Reporte</label>
          <input
            v-model="datosLineas[linea].numeroReporte"
            type="text"
            class="form-control"
            placeholder="Ej. RPT-2025-001"
          />
        </div>
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
        @click="emitirSiguiente"
      >
        Tacómetros <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";
import Swal from "sweetalert2";


const props = defineProps({
  lineas: Array,
});

const emit = defineEmits(["siguiente"]);
const datosLineas = ref({});

function validarLineas() {
  return props.lineas.every((linea) => {
    const datos = datosLineas.value[linea];
    return (
      datos.estado.trim() !== "" &&
      datos.numeroReporte.trim() !== ""
    );
  });
}

// Inicializar estructura cuando props.lineas esté disponible
watch(
  () => props.lineas,
  (lineas) => {
    if (Array.isArray(lineas)) {
      lineas.forEach((linea) => {
        datosLineas.value[linea] = {
          estado: "",
          reporteFalla: "",
          dual: false,
          numeroReporte: "",
        };
      });
      console.log("[✅ Datos de líneas inicializados]", datosLineas.value);
    } else {
      console.warn("[⚠️ props.lineas no es un array]", lineas);
    }
  },
  { immediate: true }
);

watch(
  datosLineas,
  (nuevo) => {
    localStorage.setItem("lineasTemp", JSON.stringify(nuevo));
  },
  { deep: true }
);

function emitirSiguiente() {
  if (!validarLineas()) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor llena el estado y el número de reporte en todas las líneas antes de continuar.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill"
      },
      buttonsStyling: false
    });
    return;
  }

  localStorage.setItem("lineasTemp", JSON.stringify(datosLineas.value));
  emit("siguiente", datosLineas.value);
}

</script>
