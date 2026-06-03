<template>
  <div class="p-4">
    <h5 class="text-center text-success mb-4 fw-bold">Fotografías de gases</h5>

    <div class="row g-4">
      <!-- CARD -->
      <div v-for="tipo in ['media', 'baja', 'cero']" :key="tipo" class="col-12 col-md-4">
        <div class="gas-card h-100 shadow-sm">
          <!-- HEADER -->
          <div class="gas-header" :class="`header-${tipo}`">
            Gas {{ tipo.charAt(0).toUpperCase() + tipo.slice(1) }}
          </div>

          <!-- BODY -->
          <div class="gas-body">
            <!-- SIN IMAGEN -->
            <div
              v-if="!imagenes[tipo]"
              class="upload-zone"
              @click="seleccionarImagen(tipo)"
            >
              <i class="bi bi-camera fs-2 mb-2"></i>
              <div>Tomar o subir fotografía</div>
            </div>

            <!-- CON IMAGEN -->
            <div v-else class="image-container">
              <img :src="getPreview(imagenes[tipo])" class="preview-img" />

              <button class="delete-btn" @click="eliminarImagen(tipo)">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-4">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
        @click="continuar"
      >
        Continuar <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="d-none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import Swal from "sweetalert2";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore();
const emit = defineEmits(["update:modelValue", "siguiente"]);

const fileInput = ref(null);
const gasActual = ref(null);

const imagenes = reactive({
  media: null,
  baja: null,
  cero: null,
});

const imagenesHashes = reactive({
  media: null,
  baja: null,
  cero: null,
});

/* =========================
   SELECCIONAR IMAGEN
========================= */
function seleccionarImagen(tipo) {
  gasActual.value = tipo;
  fileInput.value.click();
}

/* =========================
   CALCULAR HASH
========================= */
async function calcularHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* =========================
   VERIFICAR HASH EN FIRESTORE
========================= */
async function existeHashEnReportes(hash) {
  const snapshot = await getDocs(collection(db, "reportes"));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.imagenesHashes) {
      if (
        data.imagenesHashes.media === hash ||
        data.imagenesHashes.baja === hash ||
        data.imagenesHashes.cero === hash
      ) {
        return true;
      }
    }
  }
  return false;
}

/* =========================
   CUANDO SE CARGA
========================= */
async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const hash = await calcularHash(file);

  // Validar duplicado en la misma pantalla
  if (Object.values(imagenesHashes).includes(hash)) {
    Swal.fire({
      icon: "error",
      title: "Imagen duplicada",
      text: "Esta fotografía ya fue cargada en este reporte.",
    });
    e.target.value = "";
    return;
  }

  // Validar duplicado en reportes anteriores
  if (await existeHashEnReportes(hash)) {
    Swal.fire({
      icon: "error",
      title: "Imagen repetida",
      text: "Esta fotografía ya fue utilizada en un reporte anterior.",
    });
    e.target.value = "";
    return;
  }

  // Guardar imagen y hash
  imagenes[gasActual.value] = file;
  imagenesHashes[gasActual.value] = hash;

  emit("update:modelValue", {
    imagenes: { ...imagenes },
    imagenesHashes: { ...imagenesHashes },
  });
  e.target.value = "";
}

/* =========================
   ELIMINAR
========================= */
function eliminarImagen(tipo) {
  imagenes[tipo] = null;
  imagenesHashes[tipo] = null;
  emit("update:modelValue", {
    imagenes: { ...imagenes },
    imagenesHashes: { ...imagenesHashes },
  });
}

/* =========================
   PREVIEW
========================= */
function getPreview(file) {
  return URL.createObjectURL(file);
}

/* =========================
   VALIDACIÓN
========================= */
function continuar() {
  if (!imagenes.media || !imagenes.baja || !imagenes.cero) {
    Swal.fire({
      icon: "warning",
      title: "Faltan imágenes",
      text: "Debes subir las fotos de Media, Baja y Cero.",
    });
    return;
  }

  emit("siguiente");
}
</script>

<style scoped>
.gas-card {
  border-radius: 18px;
  border: 1px solid #eee;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s ease;
}

.gas-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.gas-header {
  padding: 12px;
  font-weight: 600;
  text-align: center;
  font-size: 0.95rem;
}

.header-media {
  background: #e7f1ff;
  color: #0d6efd;
}

.header-baja {
  background: #fff4e5;
  color: #ff9800;
}

.header-cero {
  background: #fdeaea;
  color: #dc3545;
}

.gas-body {
  padding: 20px;
}

.upload-zone {
  border: 2px dashed #dcdcdc;
  border-radius: 14px;
  padding: 30px 15px;
  text-align: center;
  cursor: pointer;
  color: #777;
  transition: all 0.2s ease;
}

.upload-zone:hover {
  background: #f9f9f9;
  border-color: #999;
}

.image-container {
  position: relative;
}

.preview-img {
  width: 100%;
  max-height: 230px;
  object-fit: cover;
  border-radius: 14px;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 53, 69, 0.9);
  border: none;
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.delete-btn:hover {
  background: #dc3545;
}
</style>
