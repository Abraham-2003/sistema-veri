<template>
  <div
    class="container py-4"
    ref="contenidoReporte"
    :class="{ 'modo-pdf': modoExportacion }"
  >
    <h3 class="mb-3">Reporte Diario - {{ ubicacionCentro }}</h3>
    <p>Fecha: {{ fechaSeleccionada }}</p>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <button
        class="btn btn-outline-primary"
        @click="mostrarCalendario = !mostrarCalendario"
      >
        {{ mostrarCalendario ? "Ocultar calendario" : "Mostrar calendario" }}
      </button>

      <button
        class="btn btn-danger d-flex align-items-center gap-2"
        @click="descargarPDF"
        :disabled="descargandoPDF"
      >
        <span
          v-if="descargandoPDF"
          class="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        ></span>

        <span>
          {{ descargandoPDF ? "Generando PDF..." : "Descargar reporte en PDF" }}
        </span>
      </button>
    </div>

    <transition name="fade">
      <!-- Calendario solo visible si mostrarCalendario es true -->
      <div v-if="mostrarCalendario" class="mt-3">
        <VueCal
          locale="es"
          :selected-date="fechaSeleccionada"
          :events="eventosDeReporte"
          @event-click="seleccionarReporteDesdeEvento"
          default-view="week"
          hide-view-selector
          style="height: 300px"
        />
      </div>
    </transition>

    <!-- Estado de carga -->
    <div v-if="loading" class="text-center text-muted">Cargando reporte...</div>

    <!-- Mensaje cuando no hay reporte seleccionado -->
    <div v-else-if="!reporteSeleccionado" class="alert alert-warning">
      Seleccione una fecha para ver el reporte.
    </div>
    <div v-else class="accordion" id="reporteCollapse">
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingCalibraciones">
          <button
            class="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseCalibraciones"
          >
            Calibraciones
          </button>
        </h2>
        <div
          id="collapseCalibraciones"
          class="accordion-collapse collapse show"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            <table class="table table-bordered table-sm text-center align-middle">
              <thead class="table-light">
                <tr>
                  <th>Línea</th>
                  <th>Analizador Gases</th>
                  <th>Dinamómetros</th>
                  <th>Fugas</th>
                  <th>Comprobacion de Gases</th>
                  <th>Opacímetro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="[linea, equipos] in lineasCalibradas" :key="linea">
                  <td>
                    <strong>{{ linea }}</strong>
                  </td>
                  <td
                    v-for="equipo in [
                      'Analizador Gases',
                      'Dinamómetros',
                      'Fugas',
                      'Comprobacion de gases',
                      'Opacímetro',
                    ]"
                    :key="equipo"
                  >
                    <div
                      :class="equipos[equipo] ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="reporteSeleccionado.observacionesCalibraciones" class="mt-3">
              <h6 class="text-muted">Observaciones generales</h6>
              <p class="border rounded p-2 bg-light text-start">
                {{ reporteSeleccionado.observacionesCalibraciones }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gases -->

      <div class="accordion-item">
  <h2 class="accordion-header" id="headingGases">
    <button
      class="accordion-button collapsed"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#collapseGases"
    >
      Gases
    </button>
  </h2>

  <div
    id="collapseGases"
    class="accordion-collapse collapse"
    data-bs-parent="#reporteCollapse"
  >
    <div class="accordion-body">

      <!-- =========================
           GASES EN USO
      ========================== -->
      <h5 class="mb-3 fw-bold">Gases en uso</h5>

      <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-light text-center">
            <tr>
              <th>Tipo</th>
              <th>Serie</th>
              <th>PSI</th>
              <th>Estatus</th>
              <th>#Reporte</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(gas, i) in gasesUsoOrdenados"
              :key="'uso-' + (gas.id ?? i)"
              class="text-center"
            >
              <td class="fw-semibold">{{ gas.tipo }}</td>
              <td>{{ gas.serie || '-' }}</td>
              <td>{{ gas.psi || '-' }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'bg-success': gas.estatus === 'Bueno',
                    'bg-warning text-dark': gas.estatus === 'Regular',
                    'bg-danger': gas.estatus === 'Malo'
                  }"
                >
                  {{ gas.estatus || '-' }}
                </span>
              </td>
              <td>{{ gas.reporte || '-' }}</td>
              <td>{{ gas.observaciones || 'Sin observaciones' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- =========================
           IMÁGENES POR TIPO
      ========================== -->
      <div
  v-if="imagenesGases.length"
  class="mt-5"
>
  <h5 class="fw-bold mb-3">Evidencia fotográfica</h5>

  <div v-viewer class="row g-4">

    <div
      v-for="(img, index) in imagenesGases"
      :key="index"
      class="col-md-4"
    >
      <div class="card shadow-sm h-100 border-0">

        <div
          class="card-header text-center fw-semibold"
          :class="{
            'bg-primary text-white': img.tipo === 'media',
            'bg-warning text-dark': img.tipo === 'baja',
            'bg-danger text-white': img.tipo === 'cero'
          }"
        >
          Gas {{ img.tipo.charAt(0).toUpperCase() + img.tipo.slice(1) }}
        </div>

        <div class="card-body text-center">
          <img
            :src="img.url"
            class="img-fluid rounded"
            style="max-height: 250px; object-fit: contain; cursor: zoom-in"
          />
        </div>

      </div>
    </div>

  </div>
</div>

      <!-- =========================
           GASES EN STOCK
      ========================== -->
      <h5 class="mt-5 mb-3 fw-bold">Gases en stock</h5>

      <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-light text-center">
            <tr>
              <th>Tipo</th>
              <th>Serie</th>
              <th>PSI</th>
              <th>Estatus</th>
              <th>#Reporte</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(gas, i) in gasesStockOrdenados"
              :key="'stock-' + (gas.id ?? i)"
              class="text-center"
            >
              <td class="fw-semibold">{{ gas.tipo }}</td>
              <td>{{ gas.serie || '-' }}</td>
              <td>{{ gas.psi || '-' }}</td>
              <td>{{ gas.estatus || '-' }}</td>
              <td>{{ gas.reporte || '-' }}</td>
              <td>{{ gas.observaciones || 'Sin observaciones' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</div>

      <!-- Compresor -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingCompresor">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseCompresor"
          >
            Compresor
          </button>
        </h2>
        <div
          id="collapseCompresor"
          class="accordion-collapse collapse"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            <table class="table table-bordered table-sm text-center align-middle">
              <thead class="table-light">
                <tr>
                  <th>Estatus</th>
                  <th>Observaciones</th>
                  <th>Nivel de Aceite</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ reporteSeleccionado.compresor.estatus }}</td>
                  <td>{{ reporteSeleccionado.compresor.observaciones }}</td>
                  <td>{{ reporteSeleccionado.compresor.nivelAceite }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Líneas -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingLineas">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseLineas"
          >
            Líneas
          </button>
        </h2>

        <div
          id="collapseLineas"
          class="accordion-collapse collapse"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            <table class="table table-bordered table-sm text-center align-middle">
              <thead class="table-light">
                <tr>
                  <th>Línea</th>
                  <th>Estado</th>
                  <th>Opacímetro</th>
                  <th>Reporte de falla</th>
                  <th>#Reporte</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(datos, linea) in reporteSeleccionado.lineas" :key="linea">
                  <td>
                    <strong>{{ linea }}</strong>
                  </td>

                  <td>{{ datos.estado }}</td>

                  <!-- OPACÍMETRO -->
                  <td>
                    <!-- OK -->
                    <span
                      v-if="datos.opacimetro?.estado === 'Operativo'"
                      class="badge bg-success"
                    >
                      Operativo
                    </span>

                    <!-- FUERA DE SERVICIO -->
                    <span
                      v-else-if="datos.opacimetro?.estado === 'Fuera de servicio'"
                      class="badge bg-danger"
                    >
                      Fuera de servicio
                    </span>
                    <!-- EN MANTENIMIENTO -->
                    <span
                      v-else-if="datos.opacimetro?.estado === 'En mantenimiento'"
                      class="badge bg-warning"
                    >
                      En mantenimiento
                    </span>

                    <!-- NO APLICA -->
                    <span v-else class="bi bi-dash-circle"></span>
                  </td>

                  <td>{{ datos.reporteFalla }}</td>
                  <td>{{ datos.numeroReporte }}</td>
                </tr>
              </tbody>
            </table>

            <small class="text-muted d-block mt-2">
              <i class="bi bi-dash-circle"></i> No aplica (líneas sin opacímetro)
            </small>
          </div>
        </div>
      </div>

      <!-- Tacómetros -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingTacometros">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseTacometros"
          >
            Tacómetros
          </button>
        </h2>

        <div
          id="collapseTacometros"
          class="accordion-collapse collapse"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            <table class="table table-bordered table-sm text-center align-middle">
              <thead class="table-light">
                <tr>
                  <th>Línea</th>
                  <th>Pinza</th>
                  <th>OBD</th>
                  <th>Batería</th>
                  <th>Encendedor</th>
                  <th>Contacto</th>
                  <th>Especiales</th>
                  <th>Observaciones</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(datos, linea) in reporteSeleccionado.tacometros" :key="linea">
                  <!-- Línea -->
                  <td>
                    <strong>{{ linea }}</strong>

                    <!-- Detecta DUAL automáticamente -->
                    <span v-if="datos.especiales" class="badge bg-info ms-1"> DUAL </span>
                  </td>

                  <!-- Campos normales -->
                  <td
                    v-for="campo in ['Pinza', 'OBD', 'Batería', 'Encendedor', 'Contacto']"
                    :key="campo"
                  >
                    <i
                      :class="
                        datos[campo]
                          ? 'bi bi-check-circle-fill text-success'
                          : 'bi bi-x-circle-fill text-danger'
                      "
                      :title="datos[campo] ? 'OK' : 'MAL'"
                    ></i>
                  </td>

                  <!-- Especiales -->
                  <td class="text-start">
                    <div v-if="datos.especiales">
                      <div
                        v-for="(valor, nombre) in datos.especiales"
                        :key="nombre"
                        class="d-flex align-items-center mb-1"
                      >
                        <i
                          :class="
                            valor
                              ? 'bi bi-check-circle-fill text-success'
                              : 'bi bi-x-circle-fill text-danger'
                          "
                          class="me-1"
                        ></i>
                        <small>{{ nombre }}</small>
                      </div>
                    </div>

                    <span v-else class="text-muted">—</span>
                  </td>

                  <!-- Observaciones -->
                  <td class="text-start">
                    {{ datos.observaciones || "—" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingObservaciones">
          <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseObservaciones"
          >
            Observaciones
          </button>
        </h2>
        <div
          id="collapseObservaciones"
          class="accordion-collapse collapse"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            <div class="mb-2">
              <textarea
                v-model="reporteSeleccionado.observaciones"
                class="form-control"
                rows="4"
                placeholder="Agregar observaciones generales..."
              ></textarea>
            </div>

            <div class="text-end">
              <button class="btn btn-sm btn-primary" @click="guardarObservaciones">
                Guardar observaciones
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import html2pdf from "html2pdf.js";
import "bootstrap/dist/js/bootstrap.bundle";
import { Modal } from "bootstrap";
import { getFunctions, httpsCallable } from "firebase/functions";

const descargandoPDF = ref(false);

const imagenSeleccionada = ref(null);
let modal = null;

const fechasConReporte = ref([]);
const imagenesGases = computed(() => {
  const imgs = reporteSeleccionado.value?.imagenes
  if (!imgs) return []

  return Object.entries(imgs)
    .filter(([_, url]) => url)
    .map(([tipo, url]) => ({
      tipo,
      url
    }))
})
const cargarFechasConReporte = async () => {
  if (!centroId.value) return;
  const snapshot = await getDocs(
    query(collection(db, "reportes"), where("centroId", "==", centroId.value))
  );
  fechasConReporte.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const guardarObservaciones = async () => {
  if (!reporteSeleccionado.value?.id) {
    alert("No hay reporte seleccionado");
    return;
  }

  try {
    await updateDoc(doc(db, "reportes", reporteSeleccionado.value.id), {
      observaciones: reporteSeleccionado.value.observaciones || "",
    });

    alert("Observaciones actualizadas correctamente");
  } catch (error) {
    console.error("[❌ Error al actualizar observaciones]", error);
    alert("No se pudieron guardar las observaciones");
  }
};

const lineasCalibradas = computed(() => {
  const calibs = reporteSeleccionado.value?.calibraciones;
  if (!calibs || typeof calibs !== "object") return [];
  return Object.entries(calibs);
});

const centroId = ref(null);

const obtenerCentroId = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  const centroDoc = snapshot.docs.find(
    (doc) => doc.data().ubicacion === route.params.ubicacion
  );
  centroId.value = centroDoc ? centroDoc.id : null;
};

const route = useRoute();
const ubicacionCentro = route.params.ubicacion;
const fechaSeleccionada = ref(dayjs().format("YYYY-MM-DD HH:mm:ss"));
const reporte = ref(null);
const loading = ref(false);
const modoExportacion = ref(false);
const contenidoReporte = ref(null);
const mostrarCalendario = ref(false);

const seleccionarFecha = (evento) => {
  let fechaReal =
    evento?.start instanceof Date
      ? evento.start
      : evento instanceof Date
      ? evento
      : evento?.date instanceof Date
      ? evento.date
      : null;

  if (!fechaReal || !dayjs(fechaReal).isValid()) {
    return;
  }

  fechaSeleccionada.value = dayjs(fechaReal).format("YYYY-MM-DD HH:mm:ss");
  consultarReporte();
};

const eventosDeReporte = computed(() =>
  fechasConReporte.value.map((r) => {
    const fechaDate =
      r.fecha instanceof Date
        ? r.fecha
        : r.fecha?.toDate
        ? r.fecha.toDate()
        : new Date(r.fecha);

    return {
      id: r.id,
      start: dayjs(fechaDate).startOf("day").toDate(),
      end: dayjs(fechaDate).endOf("day").toDate(),
      title: "Reporte detectado",
      content: dayjs(fechaDate).format("HH:mm:ss"),
      class: "reporte-dia",
    };
  })
);

const consultarReporte = async () => {
  if (!centroId.value) return;

  const inicioDia = dayjs(fechaSeleccionada.value).startOf("day").toISOString();
  const finDia = dayjs(fechaSeleccionada.value).endOf("day").toISOString();

  const q = query(
    collection(db, "reportes"),
    where("centroId", "==", centroId.value),
    where("fecha", ">=", inicioDia),
    where("fecha", "<=", finDia)
  );

  const snapshot = await getDocs(q);
  const documento = snapshot.empty ? null : snapshot.docs[0].data();

  // Si quieres actualizar reporteSeleccionado aquí, hazlo solo si lo vas a usar en el template
  // reporteSeleccionado.value = documento;
};

const reporteSeleccionado = ref(null);

const seleccionarReporteDesdeEvento = (evento) => {
  const id = evento.id;
  const encontrado = fechasConReporte.value.find((r) => r.id === id);

  if (encontrado) {
    // Guardar el reporte y la fecha
    reporteSeleccionado.value = encontrado;
    fechaSeleccionada.value = dayjs(encontrado.fecha).format("YYYY-MM-DD HH:mm:ss");

    // Consultar el reporte
    consultarReporte();
    mostrarCalendario.value = false;
  } else {
    console.warn("[⚠️ No se encontró reporte con ID]", id);
  }
};

const ORDEN_TIPO_GAS = ["Media", "Baja", "Cero"];

const ordenarPorTipoGas = (gases) => {
  if (!Array.isArray(gases)) return [];

  return [...gases].sort((a, b) => {
    const tipoA = ORDEN_TIPO_GAS.findIndex((t) => a.tipo?.startsWith(t));
    const tipoB = ORDEN_TIPO_GAS.findIndex((t) => b.tipo?.startsWith(t));

    return tipoA - tipoB;
  });
};

const gasesUsoOrdenados = computed(() =>
  ordenarPorTipoGas(Object.values(reporteSeleccionado.value?.gases?.uso || {}).flat())
);

const gasesStockOrdenados = computed(() =>
  ordenarPorTipoGas(Object.values(reporteSeleccionado.value?.gases?.stock || {}).flat())
);
async function imagenADataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
async function prepararImagenes(container) {
  const imgs = container.querySelectorAll("img");

  for (const img of imgs) {
    if (img.src.startsWith("http")) {
      try {
        const base64 = await imagenADataURL(img.src);
        img.src = base64;
      } catch (e) {
        console.warn("No se pudo convertir imagen", img.src);
      }
    }
  }
}
const extraerPathDesdeFirebaseURL = (url) => {
  const decoded = decodeURIComponent(url);
  const match = decoded.match(/\/o\/(.+)\?/);
  return match ? match[1] : null;
};

const convertirImagenesABase64 = async () => {
  const functions = getFunctions();
  const obtenerImagen = httpsCallable(functions, "obtenerImagenBase64");

  const imgs = contenidoReporte.value.querySelectorAll("img");

  for (const img of imgs) {
    const src = img.getAttribute("src");

    if (!src || !src.includes("firebasestorage.googleapis.com")) continue;

    try {
      const path = extraerPathDesdeFirebaseURL(src);

      if (!path) {
        console.warn("No se pudo extraer path:", src);
        continue;
      }

      const { data } = await obtenerImagen({ path });

      if (data?.base64) {
        img.src = data.base64; // 🔥 clave
      }
    } catch (error) {
      console.warn("Imagen omitida:", src, error);
    }
  }
};

const descargarPDF = async () => {
  if (descargandoPDF.value) return; // evita doble click

  descargandoPDF.value = true;
  modoExportacion.value = true;

  try {
    await nextTick();
    await convertirImagenesABase64();
    await nextTick();
    await new Promise((r) => setTimeout(r, 300));

    await html2pdf()
      .set({
        margin: 10,
        filename: `Reporte_${ubicacionCentro}_${fechaSeleccionada.value}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(contenidoReporte.value)
      .save();
  } catch (error) {
    console.error("Error al generar PDF", error);
  } finally {
    modoExportacion.value = false;
    descargandoPDF.value = false;
  }
};

onMounted(async () => {
  await obtenerCentroId();
  await consultarReporte();
  await cargarFechasConReporte();
});
</script>
<style>
.reporte-dia {
  background-color: #fbeab3ff !important;
  border: 2px solid #ffc107;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.modo-pdf .accordion-collapse {
  display: block !important;
  height: auto !important;
  overflow: visible !important;
  transition: none !important;
}
.hover-shadow:hover {
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
}
.imagen-reporte {
  transition: transform 0.2s ease;
}

.imagen-reporte:hover {
  transform: scale(1.03);
}
</style>
