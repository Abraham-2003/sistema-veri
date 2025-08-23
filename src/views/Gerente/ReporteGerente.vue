<template>
  <div class="container-fluid px-3 py-3">
    <h5 class="text-center text-success mb-4">Reporte Diario</h5>

    <!-- Sección dinámica -->
    <div v-if="seccionActual === 'calibraciones'">
      <Calibraciones
        v-if="lineasCentro.length > 0"
        :lineas="lineasCentro"
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
const gases = ref(null)

function recibirGases(datos) {
  gases.value = datos
  avanzarA('compresor')
}


async function guardarReporte(datosFinales) {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId || "sin-centro";

  const reporte = {
    centroId,
    fecha: datosFinales.fecha || new Date().toISOString(),
    observaciones: datosFinales.observaciones || "",
    calibraciones: localStorage.getItem("calibracionesTemp")
      ? JSON.parse(localStorage.getItem("calibracionesTemp"))
      : {},
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
      const cantidadLineas = centroSnap.data().lineas || 0;
      lineasCentro.value = Array.from({ length: cantidadLineas }, (_, i) => i + 1);
      console.log("[📶 Líneas generadas]", lineasCentro.value);
    } else {
      console.warn("[⚠️ Centro no encontrado]", centroId);
    }
  } catch (error) {
    console.error("[❌ Error al cargar líneas]", error);
  }
});
</script>
