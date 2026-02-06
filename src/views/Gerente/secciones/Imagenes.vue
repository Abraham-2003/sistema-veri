<template>
  <div class="p-3">
    <h6 class="text-center mb-3 text-success">
      Imágenes del reporte
    </h6>

    <!-- Input cámara / galería -->
    <input
      type="file"
      class="form-control mb-3"
      accept="image/*"
      capture="environment"
      multiple
      @change="onFileChange"
    />

    <!-- Galería de imágenes -->
    <div v-if="modelValue.length" class="row g-2">
      <div
        v-for="(img, index) in modelValue"
        :key="index"
        class="col-6"
      >
        <div class="position-relative border rounded overflow-hidden">
          <img
            :src="getPreview(img)"
            class="img-fluid"
            style="height: 140px; object-fit: cover;"
          />

          <!-- Eliminar -->
          <button
            class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
            @click="eliminarImagen(index)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Botón continuar -->
    <button
      class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto"
      @click="continuar"
    >
      Continuar <i class="bi bi-arrow-right-circle me-2"></i>
    </button>
  </div>
</template>

<script setup>
import Swal from "sweetalert2"

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(["update:modelValue", "siguiente"])

/* ============================
   SUBIR IMÁGENES
============================ */
function onFileChange(e) {
  const archivos = Array.from(e.target.files)

  if (!archivos.length) return

  // Evitar duplicados (nombre + tamaño)
  const nuevos = archivos.filter(file =>
    !props.modelValue.some(
      img => img.name === file.name && img.size === file.size
    )
  )

  emit("update:modelValue", [...props.modelValue, ...nuevos])

  // Reset input (importantísimo en móvil)
  e.target.value = ""
}

/* ============================
   ELIMINAR IMAGEN
============================ */
function eliminarImagen(index) {
  const copia = [...props.modelValue]
  copia.splice(index, 1)
  emit("update:modelValue", copia)
}

/* ============================
   PREVIEW
============================ */
function getPreview(file) {
  return URL.createObjectURL(file)
}

/* ============================
   VALIDACIÓN + CONTINUAR
============================ */
function continuar() {
  if (!props.modelValue.length) {
    Swal.fire({
      icon: "warning",
      title: "Imagen requerida",
      text: "Debes subir al menos una imagen para continuar.",
      confirmButtonText: "Entendido"
    })
    return
  }

  emit("siguiente")
}
</script>
