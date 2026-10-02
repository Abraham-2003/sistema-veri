<template>
  <div class="container-fluid px-3 py-3">
    <h5 class="text-center text-success mb-1">Reporte Diario</h5>
    <p v-if="ventanaActiva" class="text-center text-muted small mb-4">{{ ventanaActiva.etiqueta }}</p>

    <!-- FUERA DE HORARIO: solo se puede registrar cambio de tanque -->
    <div v-if="!ventanaActiva">
      <CambioTanqueFueraHorario
        :centro-id="reporte.centroId"
        :mensaje-horario="proximaVentanaTexto"
      />
    </div>

    <!-- DENTRO DE HORARIO: wizard normal -->
    <div v-else>
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
          :centro-id="reporte.centroId"
          :ultimo-reporte="ultimoReporte"
          :cambios-pendientes="cambiosPendientes"
          @siguiente="avanzarA('imagenes')"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import {
  doc, getDoc, getFirestore, addDoc, collection, query, where, orderBy, limit, getDocs,
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL,
} from "firebase/storage";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import dayjs from "dayjs";

// Secciones
import Calibraciones from "./secciones/Calibraciones.vue";
import Gases from "./secciones/Gases.vue";
import Compresor from "./secciones/Compresor.vue";
import Lineas from "./secciones/Lineas.vue";
import Tacometros from "./secciones/Tacometros.vue";
import Observaciones from "./secciones/Observaciones.vue";
import Imagenes from "./secciones/Imagenes.vue";
import CambioTanqueFueraHorario from "./secciones/CambioTanqueFueraHorario.vue";

const router = useRouter();
const db = getFirestore();
const storage = getStorage();
const enviando = ref(false);
const centroNombre = ref("");


const VENTANAS_REPORTE = [
  { id: "manana", etiqueta: "Reporte de la mañana", inicio: "00:00", limite: "10:30" },
  { id: "noche", etiqueta: "Reporte de la noche", inicio: "17:30", limite: "23:59" },
];

const ahora = ref(dayjs());
let relojId = null;
onMounted(() => { relojId = setInterval(() => { ahora.value = dayjs(); }, 30000); });
onUnmounted(() => clearInterval(relojId));

const ventanaActiva = computed(() => {
  const hm = ahora.value.format("HH:mm");
  return VENTANAS_REPORTE.find((v) => hm >= v.inicio && hm <= v.limite) || null;
});

const proximaVentanaTexto = computed(() => {
  if (ventanaActiva.value) return "";
  const hm = ahora.value.format("HH:mm");
  const siguiente = VENTANAS_REPORTE.find((v) => hm < v.inicio) || VENTANAS_REPORTE[0];
  return `${siguiente.etiqueta} — se abre a las ${siguiente.inicio}`;
});

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
  "calibraciones", "gases", "imagenes", "compresor", "lineas", "tacometros", "final",
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

/* ───── Continuidad de gases (para el hijo Gases.vue) ─────
   El padre es dueño de esta consulta porque también la necesita para
   saber, fuera de horario, si ya hay un cambio pendiente sin reflejar. */
const ultimoReporte = ref(null);
const cambiosPendientes = ref({});

async function cargarContinuidadGases(centroId) {
  if (!centroId) return;

  const qReporte = query(
    collection(db, "reportes"),
    where("centroId", "==", centroId),
    orderBy("fecha", "desc"),
    limit(1)
  );
  const snap = await getDocs(qReporte);
  ultimoReporte.value = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };

  cambiosPendientes.value = {};
  if (ultimoReporte.value?.fecha) {
    const qCambios = query(
      collection(db, "cambiosTanque"),
      where("centroId", "==", centroId),
      where("fecha", ">", ultimoReporte.value.fecha),
      orderBy("fecha", "asc")
    );
    const snapCambios = await getDocs(qCambios);
    snapCambios.docs.forEach((d) => { cambiosPendientes.value[d.data().tipo] = d.data(); });
  }
}

// Si entras a una ventana de reporte, refresca por si se registró un cambio
// mientras estabas fuera de horario.
watch(ventanaActiva, (v) => { if (v) cargarContinuidadGases(reporte.centroId); });

// Validaciones básicas
function validarReporte() {
  if (!reporte.centroId) return "Falta centro";
  return null;
}

// Guardar reporte en Firestore
async function guardarReporte(datos) {
  if (enviando.value) return;

  const error = validarReporte();
  if (error) {
    Swal.fire({ icon: "warning", title: "Validación", text: error });
    return;
  }

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

    for (const tipo of ["media", "baja", "cero"]) {
      const file = reporte.imagenes[tipo];
      const refImg = storageRef(
        storage,
        `reportes/${reporte.centroId}/${tipo}-${Date.now()}-${file.name}`
      );
      await uploadBytes(refImg, file);
      const url = await getDownloadURL(refImg);
      urls[tipo] = url;
    }

    const reporteFinal = {
      centroId: reporte.centroId,
      fecha: reporte.fecha,
      observaciones: reporte.observaciones,
      nombreencargado: datos.nombreencargado, 
      observacionesCalibraciones: reporte.observacionesCalibraciones,
      calibraciones: reporte.calibraciones,
      gases: reporte.gases,
      compresor: reporte.compresor,
      lineas: reporte.lineas,
      tacometros: reporte.tacometros,
      imagenes: urls,
      imagenesHashes: { ...reporte.imagenesHashes },
    };

    await addDoc(collection(db, "reportes"), reporteFinal);

    const fechaHora = new Date().toLocaleString("es-MX", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    await Swal.fire({
      icon: "success",
      title: "Reporte enviado",
      text: `El reporte fue guardado correctamente.\nCentro: ${centroNombre.value}\nFecha y hora: ${fechaHora}`,
    });

    router.push("/Gerente/");
  } catch (error) {
    console.error("[Error al enviar reporte]", error);
    Swal.fire({ icon: "error", title: "Error al enviar", text: "Hubo un problema al guardar el reporte." });
  } finally {
    enviando.value = false;
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
      lineasCentro.value = Array.from({ length: centroData.lineas || 0 }, (_, i) => i + 1);
      lineaDual.value = centroData.lineaDual || null;
      centroNombre.value = centroData.ubicacion || "";
    } else {
      console.warn("[Centro no encontrado]", centroId);
    }
  } catch (error) {
    console.error("[Error al cargar líneas]", error);
  }

  await cargarContinuidadGases(centroId);
});
</script>