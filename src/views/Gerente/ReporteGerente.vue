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
    </div>

    <div v-else-if="seccionActual === 'compresor'">
      <Compresor @siguiente="avanzarA('lineas')" />
    </div>

    <div v-else-if="seccionActual === 'lineas'">
      <Lineas :lineas="lineasCentro" @siguiente="avanzarA('tacometros')" />
    </div>

    <div v-else-if="seccionActual === 'tacometros'">
      <Tacometros :lineas="lineasCentro" @siguiente="avanzarA('final')" />
    </div>

    <div v-else-if="seccionActual === 'final'">
      <Observaciones @guardar="guardarReporte" />
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
const router = useRouter();

const db = getFirestore();
const seccionActual = ref("calibraciones");
const lineasCentro = ref([]);
const lineaDual = ref(null);
const gases = ref(null);

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
    fecha: datosFinales.fecha || new Date().toISOString(),
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
    alert("Reporte enviado correctamente ✅");

    // Limpieza opcional
    localStorage.removeItem("calibracionesTemp");
    localStorage.removeItem("gasesTemp");
    localStorage.removeItem("compresorTemp");
    localStorage.removeItem("lineasTemp");
    localStorage.removeItem("tacometrosTemp");
    router.push("/Gerente/");
  } catch (error) {
    console.error("[❌ Error al enviar reporte]", error);
    alert("Hubo un error al enviar el reporte ❌");
  }
}

function avanzarA(seccion) {
  seccionActual.value = seccion;
  window.scrollTo({ top: 0, behavior: "smooth" });
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

      // ✅ Aquí extraes la línea dual
      lineaDual.value = centroData.lineaDual || null;

      console.log("[📶 Líneas generadas]", lineasCentro.value);
      console.log("[🎯 Línea dual]", lineaDual.value);
    } else {
      console.warn("[⚠️ Centro no encontrado]", centroId);
    }
  } catch (error) {
    console.error("[❌ Error al cargar líneas]", error);
  }
});
</script>
