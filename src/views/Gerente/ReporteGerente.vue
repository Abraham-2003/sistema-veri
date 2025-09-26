<template>
  <div class="container-fluid px-3 py-3">
    <h5 class="text-center text-success mb-4">Reporte Diario</h5>

    <!-- Sección dinámica -->
    <div v-if="seccionActual === 'calibraciones'">
      <Calibraciones
        v-if="lineasCentro.length > 0"
        :lineas="lineasCentro"
        :lineaDual="lineaDual"
        @siguiente="avanzarA('gases')"
      />
    </div>

    <div v-else-if="seccionActual === 'gases'">
      <Gases @siguiente="recibirGases" />
      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'calibraciones'"
          style="transition: all 0.2s ease"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <div v-else-if="seccionActual === 'compresor'">
      <Compresor @siguiente="avanzarA('lineas')" />
      <div class="mb-3 text-center">
        <button
          class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm"
          @click="retroceder"
          :disabled="seccionActual === 'Gases'"
        >
          <i class="bi bi-arrow-left-circle me-2"></i> Regresar
        </button>
      </div>
    </div>

    <div v-else-if="seccionActual === 'lineas'">
      <Lineas :lineas="lineasCentro" @siguiente="avanzarA('tacometros')" />
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

    <div v-else-if="seccionActual === 'tacometros'">
      <Tacometros :lineas="lineasCentro" @siguiente="avanzarA('final')" />
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

    <div v-else-if="seccionActual === 'final'">
      <Observaciones @guardar="guardarReporte" />
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
import { ref, onMounted } from "vue";
import { doc, getDoc, getFirestore, addDoc, collection } from "firebase/firestore";
import Calibraciones from "./secciones/Calibraciones.vue";
import Gases from "./secciones/Gases.vue";
import Compresor from "./secciones/Compresor.vue";
import Lineas from "./secciones/Lineas.vue";
import Tacometros from "./secciones/Tacometros.vue";
import Observaciones from "./secciones/Observaciones.vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

const router = useRouter();

const db = getFirestore();
const seccionActual = ref("calibraciones");
const lineasCentro = ref([]);
const lineaDual = ref(null);
const gases = ref(null);
const flujoSecciones = [
  "calibraciones",
  "gases",
  "compresor",
  "lineas",
  "tacometros",
  "final",
];

function recibirGases(datos) {
  gases.value = datos;
  avanzarA("compresor");
}

async function guardarReporte(datosFinales) {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId || "sin-centro";

  const calibraciones = localStorage.getItem("calibracionesTemp")
    ? JSON.parse(localStorage.getItem("calibracionesTemp"))
    : {};

  const observacionesGenerales = localStorage.getItem("observacionesGeneralesTemp") || "";

  calibraciones.observacionesGenerales = observacionesGenerales;

  const reporte = {
    centroId,
    fecha: new Date().toISOString(),
    observaciones: datosFinales.observaciones || "",
    calibraciones,
    gases: gases.value || { uso: [], stock: [] },
    compresor: localStorage.getItem("compresorTemp")
      ? JSON.parse(localStorage.getItem("compresorTemp"))
      : {},
    lineas: localStorage.getItem("lineasTemp")
      ? JSON.parse(localStorage.getItem("lineasTemp"))
      : {},
    tacometros: localStorage.getItem("tacometrosTemp")
      ? JSON.parse(localStorage.getItem("tacometrosTemp"))
      : {},
  };

  try {
    const docRef = await addDoc(collection(db, "reportes"), reporte);
    console.log("[📤 Reporte enviado]", docRef.id);
    Swal.fire({
      icon: "success",
      title: "Reporte enviado",
      text: "El reporte fue guardado correctamente.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill",
      },
      buttonsStyling: false,
    }).then(() => {
      router.push("/Gerente/");
    });

    // Limpieza opcional
    localStorage.removeItem("calibracionesTemp");
    localStorage.removeItem("observacionesGeneralesTemp");
    localStorage.removeItem("gasesTemp");
    localStorage.removeItem("compresorTemp");
    localStorage.removeItem("lineasTemp");
    localStorage.removeItem("tacometrosTemp");
    router.push("/Gerente/");
  } catch (error) {
    console.error("[Error al enviar reporte]", error);
    Swal.fire({
      icon: "error",
      title: "Error al enviar",
      text: "Hubo un problema al guardar el reporte. Intenta nuevamente.",
      confirmButtonText: "Entendido",
      customClass: {
        confirmButton: "btn btn-success text-light fw-semibold px-4 py-2 rounded-pill",
      },
      buttonsStyling: false,
    });
  }
}

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

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId;
  if (!centroId) return;

  try {
    const centroRef = doc(db, "centros", centroId);
    const centroSnap = await getDoc(centroRef);
    if (centroSnap.exists()) {
      const centroData = centroSnap.data();
      const cantidadLineas = centroData.lineas || 0;
      lineasCentro.value = Array.from({ length: cantidadLineas }, (_, i) => i + 1);

      lineaDual.value = centroData.lineaDual || null;
    } else {
      console.warn("[Centro no encontrado]", centroId);
    }
  } catch (error) {
    console.error("[Error al cargar líneas]", error);
  }
});
</script>
