<template>
  <div class="container-fluid px-3 py-3">
    <h5 class="text-center text-success mb-4">Reporte Diario</h5>

    <!-- Sección Calibraciones -->
    <div v-if="seccionActual === 'calibraciones'">
      <Calibraciones
        v-model="reporte.calibraciones"
        :lineas="lineasCentro"
        :lineaDual="lineaDual"
        @siguiente="
          (obs) => {
            reporte.observacionesCalibraciones = obs;
            avanzarA('gases');
          }
        "
      />
    </div>

    <!-- Sección Gases -->
    <div v-else-if="seccionActual === 'gases'">
      <Gases
        v-model="reporte.gases"
        @siguiente="avanzarA('imagenes')"
        :centro-id="reporte.centroId"
      />

      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'calibraciones'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <!-- Sección Imágenes -->
    <div v-else-if="seccionActual === 'imagenes'">
      <Imagenes
        @update:modelValue="
          (val) => {
            reporte.imagenes = val.imagenes;
            reporte.imagenesHashes = val.imagenesHashes;
          }
        "
        @siguiente="avanzarA('compresor')"
      />

      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'gases'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <!-- Sección Compresor -->
    <div v-else-if="seccionActual === 'compresor'">
      <Compresor v-model="reporte.compresor" @siguiente="avanzarA('lineas')" />
      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'imagenes'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <!-- Sección Líneas -->
    <div v-else-if="seccionActual === 'lineas'">
      <Lineas
        :lineas="lineasCentro"
        :lineaDual="lineaDual"
        v-model="reporte.lineas"
        @siguiente="avanzarA('tacometros')"
      />

      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'compresor'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <!-- Sección Tacómetros -->
    <div v-else-if="seccionActual === 'tacometros'">
      <Tacometros
        :lineas="lineasCentro"
        :lineaDual="lineaDual"
        v-model="reporte.tacometros"
        @siguiente="avanzarA('final')"
      />

      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'lineas'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <!-- Sección Final / Observaciones -->
    <div v-else-if="seccionActual === 'final'">
      <Observaciones
        v-model="reporte.observaciones"
        :enviando="enviando"
        @guardar="guardarReporte"
      />
      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'tacometros'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { doc, getDoc, getFirestore, addDoc, collection } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

// Secciones
import Calibraciones from "./secciones/Calibraciones.vue";
import Gases from "./secciones/Gases.vue";
import Compresor from "./secciones/Compresor.vue";
import Lineas from "./secciones/Lineas.vue";
import Tacometros from "./secciones/Tacometros.vue";
import Observaciones from "./secciones/Observaciones.vue";
import Imagenes from "./secciones/Imagenes.vue";

const router = useRouter();
const db = getFirestore();
const storage = getStorage();
const enviando = ref(false);
const centroNombre = ref("");

// Estado centralizado del reporte
const reporte = reactive({
  centroId: "",
  fecha: new Date().toISOString(),
  observaciones: "",
  observacionesCalibraciones: "",
  calibraciones: {},
  gases: { uso: [], stock: [] },
  compresor: {},
  lineas: {},
  tacometros: {},
  imagenes: { media: null, baja: null, cero: null },
  imagenesHashes: { media: null, baja: null, cero: null },
});

// Flujo de secciones
const flujoSecciones = [
  "calibraciones",
  "gases",
  "imagenes",
  "compresor",
  "lineas",
  "tacometros",
  "final",
];
const seccionActual = ref("calibraciones");

// Datos del centro
const lineasCentro = ref([]);
const lineaDual = ref(null);

function avanzarA(seccion) {
  seccionActual.value = seccion;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function retroceder() {
  const index = flujoSecciones.indexOf(seccionActual.value);
  if (index > 0) {
    seccionActual.value = flujoSecciones[index - 1];
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Validaciones básicas
function validarReporte() {
  if (!reporte.centroId) return "Falta centro";

  return null;
}

// Guardar reporte en Firestore
async function guardarReporte() {
  if (enviando.value) return;

  const error = validarReporte();
  if (error) {
    Swal.fire({ icon: "warning", title: "Validación", text: error });
    return;
  }

  // ✅ Validar que las tres imágenes estén presentes
  if (!reporte.imagenes.media || !reporte.imagenes.baja || !reporte.imagenes.cero) {
    Swal.fire({
      icon: "warning",
      title: "Faltan imágenes",
      text: "Debes subir las fotos de Media, Baja y Cero.",
    });
    return;
  }

  enviando.value = true;

  try {
    const urls = {};

    // ✅ Subir cada imagen y guardar URL
    for (const tipo of ["media", "baja", "cero"]) {
      const file = reporte.imagenes[tipo]; // aquí son File objects
      const refImg = storageRef(
        storage,
        `reportes/${reporte.centroId}/${tipo}-${Date.now()}-${file.name}`
      );

      await uploadBytes(refImg, file);
      const url = await getDownloadURL(refImg);
      urls[tipo] = url;
    }

    // ✅ Guardar en Firestore: URLs + hashes como texto plano
    const reporteFinal = {
      centroId: reporte.centroId,
      fecha: reporte.fecha,
      observaciones: reporte.observaciones,
      observacionesCalibraciones: reporte.observacionesCalibraciones,
      calibraciones: reporte.calibraciones,
      gases: reporte.gases,
      compresor: reporte.compresor,
      lineas: reporte.lineas,
      tacometros: reporte.tacometros,
      imagenes: urls, // URLs correctas
      imagenesHashes: { ...reporte.imagenesHashes }, // hashes como strings
    };

    await addDoc(collection(db, "reportes"), reporteFinal);

    const fechaHora = new Date().toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    await Swal.fire({
      icon: "success",
      title: "Reporte enviado",
      text: `El reporte fue guardado correctamente.\nCentro: ${centroNombre.value}\nFecha y hora: ${fechaHora}`,
    });

    router.push("/Gerente/");
  } catch (error) {
    console.error("[Error al enviar reporte]", error);
    Swal.fire({
      icon: "error",
      title: "Error al enviar",
      text: "Hubo un problema al guardar el reporte.",
    });
  } finally {
    enviando.value = false;
  }
}

// Subida de imágenes a Firebase Storage
async function subirImagen(file, tipo) {
  try {
    const refImg = storageRef(
      storage,
      `reportes/${reporte.centroId}/${tipo}-${Date.now()}-${file.name}`
    );
    await uploadBytes(refImg, file);
    const url = await getDownloadURL(refImg);
    reporte.imagenes[tipo] = url; // ✅ asignar por tipo
    console.log("[✅ Imagen subida]", url);
  } catch (error) {
    console.error("[Error al subir imagen]", error);
    Swal.fire({ icon: "error", text: "No se pudo subir la imagen." });
  }
}

// Cargar datos del centro
onMounted(async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId;
  if (!centroId) return;

  reporte.centroId = centroId;

  try {
    const centroRef = doc(db, "centros", centroId);
    const centroSnap = await getDoc(centroRef);
    if (centroSnap.exists()) {
      const centroData = centroSnap.data();
      lineasCentro.value = Array.from(
        { length: centroData.lineas || 0 },
        (_, i) => i + 1
      );
      lineaDual.value = centroData.lineaDual || null;
      centroNombre.value = centroData.ubicacion || "";
    } else {
      console.warn("[Centro no encontrado]", centroId);
    }
  } catch (error) {
    console.error("[Error al cargar líneas]", error);
  }
});
</script>
