<template>
  <div class="p-3">
    <h6 class="text-center mb-3 text-success">Compresor</h6>

    <div class="card shadow-sm">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Nivel de aceite (%)</label>
          <input
            v-model="localCompresor.nivelAceite"
            type="number"
            class="form-control"
            placeholder="Ej. 75"
            min="0"
            max="100"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Estatus</label>
          <select v-model="localCompresor.estatus" class="form-select">
            <option disabled value="">Selecciona estatus</option>
            <option value="Operativo">Operativo</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
            <option value="Apagado">Apagado</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea
            v-model="localCompresor.observaciones"
            class="form-control"
            rows="3"
            placeholder="Escribe observaciones..."
          ></textarea>
        </div>
      </div>
    </div>

    <div class="text-center mt-4">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto"
        @click="emitirSiguiente"
      >
        Funcionamiento de líneas <i class="bi bi-arrow-right-circle ms-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from "vue"
import Swal from "sweetalert2"

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      nivelAceite: "",
      estatus: "",
      limpieza: "",
      observaciones: ""
    })
  }
})
const emit = defineEmits(["update:modelValue", "siguiente"])

// Estado local editable
const localCompresor = ref({ ...props.modelValue })

// Sincronizar cambios con el padre
watch(
  localCompresor,
  (nuevo) => {
    emit("update:modelValue", nuevo)
  },
  { deep: true }
)

function validarCompresor() {
  return (
    localCompresor.value.nivelAceite !== "" &&
    localCompresor.value.estatus.trim() !== ""
  )
}

function emitirSiguiente() {
  if (!validarCompresor()) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor llena el nivel de aceite y el estatus del compresor antes de continuar.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill"
      },
      buttonsStyling: false
    })
    return
  }

  emit("siguiente")
}
</script>
