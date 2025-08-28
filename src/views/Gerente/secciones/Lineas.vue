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
          <input v-model="datosLineas[linea].reporteFalla" type="text" class="form-control" placeholder="Ej. Falla en sensor de opacidad" />
        </div>

        <div class="mb-3">
          <label class="form-label">#Reporte</label>
          <input v-model="datosLineas[linea].numeroReporte" type="text" class="form-control" placeholder="Ej. RPT-2025-001" />
        </div>
      </div>
    </div>

    <button class="btn btn-success w-100 mt-3" @click="emitirSiguiente">
      Tacómetros →
    </button>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
  lineas: Array
})

const emit = defineEmits(['siguiente'])
const datosLineas = ref({})

// Inicializar estructura cuando props.lineas esté disponible
watch(
  () => props.lineas,
  (lineas) => {
    if (Array.isArray(lineas)) {
      lineas.forEach(linea => {
        datosLineas.value[linea] = {
          estado: '',
          reporteFalla: '',
          dual: false,
          numeroReporte: ''
        }
      })
      console.log('[✅ Datos de líneas inicializados]', datosLineas.value)
    } else {
      console.warn('[⚠️ props.lineas no es un array]', lineas)
    }
  },
  { immediate: true }
)

watch(datosLineas, (nuevo) => {
  localStorage.setItem('lineasTemp', JSON.stringify(nuevo))
}, { deep: true })


function emitirSiguiente() {
  emit('siguiente', datosLineas.value)
}
</script>
