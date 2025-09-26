<template>
  <div>
    <h6 class="text-center mb-3 text-success">Compresor</h6>

    <div class="card shadow-sm">
      <div class="card-body">
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
    <br>
    <div class="text-center">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
        @click="emitirSiguiente"
      >
        Funcionamiento de líneas <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch } from "vue";
import Swal from "sweetalert2";

const emit = defineEmits(["siguiente"]);

function validarCompresor() {
  return (
    compresor.value.nivelAceite !== "" &&
    compresor.value.estatus.trim() !== ""
  );
}

const compresor = ref({
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
    });
    return;
  }

  localStorage.setItem("compresorTemp", JSON.stringify(compresor.value));
  emit("siguiente", compresor.value);
}

</script>
