<template>
  <div>
    <h6 class="text-center mb-3 text-success">Calibraciones por línea</h6>

    <!-- Tarjetas por línea -->
    <div v-for="(linea, index) in props.lineas" :key="index" class="card mb-3 shadow-sm">
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

    <div v-for="equipo in equipos" :key="equipo" class="form-check mb-2">
      <input
        class="form-check-input"
        type="checkbox"
        :id="`check-${linea}-${equipo}`"
        v-model="calibraciones[linea][equipo]"
      />
      <label class="form-check-label" :for="`check-${linea}-${equipo}`">
        {{ equipo }}
      </label>
    </div>
  </div>
</div>


    <button class="btn btn-success w-100 mt-3" @click="emitirSiguiente">
      Gases →
    </button>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'

const props = defineProps({
  lineas: {
    type: Array,
    default: () => []
  }
})

const equipos = [
  'Analizador Gases',
  'Dinamómetros',
  'Estación Meteorológica',
  'Tacómetros',
  'Manómetros',
  'Opacímetro',
  'Tacómetro Óptico',
  'Termocopla',
  'Filtro Opacidad',
  'Pesas'
]

const calibraciones = ref({})
const emit = defineEmits(['siguiente'])
function todasSeleccionadas(linea) {
  return equipos.every(equipo => calibraciones.value[linea][equipo])
}

function toggleLinea(linea) {
  const estado = !todasSeleccionadas(linea)
  equipos.forEach(equipo => {
    calibraciones.value[linea][equipo] = estado
  })
}


// Inicializar calibraciones cuando props.lineas esté disponible
watch(
  () => props.lineas,
  (lineas) => {
    if (Array.isArray(lineas) && lineas.length > 0) {
      calibraciones.value = {} // Reiniciar estructura
      lineas.forEach(linea => {
        calibraciones.value[linea] = {}
        equipos.forEach(equipo => {
          calibraciones.value[linea][equipo] = false
        })
      })
      console.log('[✅ Calibraciones inicializadas]', calibraciones.value)
    } else {
      console.warn('[⚠️ props.lineas no es un array válido]', lineas)
    }
  },
  { immediate: true }
)

// Guardar temporalmente en localStorage (opcional)
watch(calibraciones, (nuevo) => {
  localStorage.setItem('calibracionesTemp', JSON.stringify(nuevo))
}, { deep: true })

function emitirSiguiente() {
  emit('siguiente', calibraciones.value)
}
</script>
