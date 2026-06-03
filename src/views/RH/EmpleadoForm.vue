<template>

  <div class="modal-backdrop">

    <div class="modal-card">

      <h5>
        {{ empleadoLocal.id
          ? "Editar empleado"
          : "Registrar empleado"
        }}
      </h5>

      <form @submit.prevent="guardar">

        <div class="mb-3">

          <label class="form-label">
            Nombre
          </label>

          <input
            v-model="empleadoLocal.nombre"
            type="text"
            class="form-control"
            required
          />

        </div>

        <div class="mb-3">

          <label class="form-label">
            Centro
          </label>

          <select
            v-model="empleadoLocal.centroId"
            class="form-select"
            required
          >

            <option value="">
              Seleccione centro
            </option>

            <option
              v-for="c in centros"
              :key="c.id"
              :value="c.id"
            >
              {{ c.ubicacion }}
            </option>

          </select>

        </div>

        <div class="mb-3">

          <label class="form-label">
            Fecha ingreso
          </label>

          <input
            v-model="empleadoLocal.fechaIngreso"
            type="date"
            class="form-control"
            required
          />

        </div>

        <div class="d-flex justify-content-end gap-2">

          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('cerrar')"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn btn-success"
          >
            Guardar
          </button>

        </div>

      </form>

    </div>

  </div>

</template>

<script setup>

import {
  ref,
  onMounted,
  watch
} from "vue"

import {
  obtenerCentros
} from "../../servivces/centros/centros.repository"

const props = defineProps({
  empleadoEditar: Object
})

const emit = defineEmits([
  "guardar",
  "cerrar"
])

const centros = ref([])

const empleadoLocal = ref({
  nombre: "",
  centroId: "",
  fechaIngreso: ""
})

// ======================================================

watch(() => props.empleadoEditar, (nuevo) => {

  if (nuevo) {

    empleadoLocal.value = {
      ...nuevo,
      fechaIngreso:
        nuevo.fechaIngreso?.split("T")[0]
    }

  } else {

    empleadoLocal.value = {
      nombre: "",
      centroId: "",
      fechaIngreso: ""
    }
  }

}, { immediate: true })

// ======================================================

onMounted(async () => {

  centros.value = await obtenerCentros()
})

// ======================================================

const guardar = () => {

  emit("guardar", empleadoLocal.value)
}

</script>

<style scoped>

.modal-backdrop {

  position: fixed;
  inset: 0;

  background: rgba(0,0,0,0.5);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 999;
}

.modal-card {

  width: 420px;

  background: white;

  border-radius: 14px;

  padding: 1.5rem;
}

</style>