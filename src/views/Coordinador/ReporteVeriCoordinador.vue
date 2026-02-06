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

      <button class="btn btn-danger" @click="descargarPDF">
        Descargar reporte en PDF
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
            <h6>En uso</h6>
            <table class="table table-bordered table-sm">
              <thead class="table-light">
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
                <tr v-for="(gas, i) in gasesUsoOrdenados" :key="'uso-' + gas.id ?? i">
                  <td>{{ gas.tipo }}</td>
                  <td>{{ gas.serie }}</td>
                  <td>{{ gas.psi }}</td>
                  <td>{{ gas.estatus }}</td>
                  <td>{{ gas.reporte }}</td>
                  <td>{{ gas.observaciones }}</td>
                </tr>
              </tbody>
            </table>

            <h6 class="mt-4">En stock</h6>
            <table class="table table-bordered table-sm">
              <thead class="table-light">
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
                <tr v-for="(gas, i) in gasesStockOrdenados" :key="'stock-' + gas.id ?? i">
                  <td>{{ gas.tipo }}</td>
                  <td>{{ gas.serie }}</td>
                  <td>{{ gas.psi }}</td>
                  <td>{{ gas.estatus }}</td>
                  <td>{{ gas.reporte }}</td>
                  <td>{{ gas.observaciones }}</td>
                </tr>
              </tbody>
            </table>
            <!-- Imágenes del reporte -->
            <!-- Galería de imágenes -->
            <div
              v-if="
                Array.isArray(reporteSeleccionado?.imagenes) &&
                reporteSeleccionado.imagenes.length
              "
              class="mt-4"
            >
              <h6>Imágenes de gases</h6>

              <div class="row g-3">
                <div
                  v-for="(img, index) in reporteSeleccionado.imagenes"
                  :key="index"
                  class="col-6 col-md-4 col-lg-3"
                >
                  <div
                    class="border rounded p-2 h-100 text-center hover-shadow"
                    @click="abrirImagen(img)"
                  >
                    <img
                      :src="img"
                      class="img-fluid rounded"
                      alt="Imagen del reporte"
                      style="max-height: 200px; object-fit: contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal imagen -->
            <div class="modal fade" id="modalImagen" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content">
                  <div class="modal-header">
                    <h6 class="modal-title">Imagen del reporte</h6>
                    <button
                      type="button"
                      class="btn-close"
                      data-bs-dismiss="modal"
                    ></button>
                  </div>

                  <div class="modal-body text-center">
                    <img
                      :src="imagenSeleccionada"
                      class="img-fluid rounded imagen-zoom"
                      :class="{ zoom: zoomActivo }"
                      @click="toggleZoom"
                    />
                  </div>
                </div>
              </div>
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
            {{ reporteSeleccionado.observaciones }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import html2pdf from "html2pdf.js";
import "bootstrap/dist/js/bootstrap.bundle";
import { Modal } from "bootstrap";

const imagenSeleccionada = ref(null);
let modal = null;

function abrirImagen(url) {
  imagenSeleccionada.value = url;
  zoomActivo.value = false;

  if (!modal) {
    modal = new Modal(document.getElementById("modalImagen"));
  }

  modal.show();
}

const zoomActivo = ref(false);

function toggleZoom() {
  zoomActivo.value = !zoomActivo.value;
}

const fechasConReporte = ref([]);

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

  console.log("[🟢 Documento completo desde Firestore]", documento);

  // Si quieres actualizar reporteSeleccionado aquí, hazlo solo si lo vas a usar en el template
  // reporteSeleccionado.value = documento;
};

const reporteSeleccionado = ref(null);

const seleccionarReporteDesdeEvento = (evento) => {
  const id = evento.id;
  const encontrado = fechasConReporte.value.find((r) => r.id === id);

  if (encontrado) {
    console.log("[🟡 Reporte seleccionado desde evento]", encontrado);

    // Guardar el reporte y la fecha
    reporteSeleccionado.value = encontrado;
    fechaSeleccionada.value = dayjs(encontrado.fecha).format("YYYY-MM-DD HH:mm:ss");

    // Consultar el reporte
    consultarReporte();

    // 🔴 Cerrar el calendario automáticamente
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

const descargarPDF = () => {
  modoExportacion.value = true;

  setTimeout(() => {
    html2pdf()
      .set({
        margin: 10,
        filename: `Reporte_${ubicacionCentro}_${fechaSeleccionada.value}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 4 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(contenidoReporte.value)
      .save();

    setTimeout(() => {
      modoExportacion.value = false;
    }, 1000);
  }, 500);
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
.imagen-zoom {
  max-height: 80vh;
  object-fit: contain;
  transition: transform 0.3s ease;
  cursor: zoom-in;
}

.imagen-zoom.zoom {
  transform: scale(2);
  cursor: zoom-out;
}
</style>
