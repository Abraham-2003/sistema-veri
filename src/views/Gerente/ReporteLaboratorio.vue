<template>
  <div class="container py-3">
    <h5 class="text-center text-success mb-4">Reportes de Laboratorio</h5>

    <!-- Botón para abrir el modal -->

    <div class="modal fade" id="modalLab" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <form class="modal-content" @submit.prevent="guardarReporteLab">
          <div class="modal-header">
            <h5 class="modal-title">Agregar reporte de laboratorio</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <!-- Tipo principal -->
            <label class="form-label small text-muted">Tipo</label>
            <select v-model="nuevo.tipo" class="form-select mb-3" required>
              <option disabled value="">Selecciona un tipo</option>
              <option v-for="(config, nombre) in calibraciones" :key="nombre" :value="nombre">
                {{ nombre }}
              </option>
            </select>

            <!-- Subtipo -->
            <div v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.subtipos?.length" class="mb-3">
              <label class="form-label small text-muted">Subtipo</label>
              <select v-model="nuevo.subtipo" class="form-select" required>
                <option disabled value="">Selecciona una opción</option>
                <option v-for="sub in calibraciones[nuevo.tipo].subtipos" :key="sub" :value="sub">
                  {{ sub }}
                </option>
              </select>
            </div>

            <!-- Selección de línea -->
            <!-- Selección de línea si aplica a todas las líneas -->
            <div v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.aplica === 'todasLineas'" class="mb-3">
              <label class="form-label small text-muted">Selecciona línea</label>
              <select v-model="nuevo.linea" class="form-select" required>
                <option disabled value="">Selecciona una línea</option>
                <option v-for="n in parseInt(centro?.lineas || 0)" :key="n" :value="n">
                  Línea {{ n }}
                </option>
              </select>
            </div>

            <!-- Línea dual -->
            <div v-if="nuevo.tipo && calibraciones[nuevo.tipo]?.aplica === 'lineaDual'" class="alert alert-warning">
              <strong>Este reporte aplica únicamente a la línea dual:</strong>
              Línea {{ centro?.lineaDual }}
            </div>

            <!-- Campos generales -->
            <label class="form-label small text-muted">Folio</label>
            <input v-model="nuevo.folio" class="form-control mb-2" required />

            <label class="form-label small text-muted">Fecha de dictamen</label>
            <input v-model="nuevo.dictamen" type="date" class="form-control mb-3" required />
            <label class="form-label small text-muted">Fecha de calibración</label>
            <input v-model="nuevo.calibracion" type="date" class="form-control mb-3" required />

            <label class="form-label small text-muted">Fecha de vencimiento</label>
            <input v-model="nuevo.vencimiento" type="date" class="form-control mb-2" required />
            <label class="form-label small text-muted">Archivo PDF</label>
            <input ref="pdfInput" type="file" accept="application/pdf" class="form-control mb-3" @change="onFileChange"
              required />
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn btn-success w-100" :disabled="guardandoReporte">
              <span v-if="guardandoReporte" class="spinner-border spinner-border-sm me-2"></span>

              {{ guardandoReporte ? "Guardando..." : "Guardar" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="d-grid mb-3">
      <button class="btn btn-outline-success" @click="abrirModal">Nuevo reporte</button>
    </div>
    <!-- Tabla de reportes -->
    <div class="table-responsive d-none d-md-block">
      <table class="table table-bordered align-middle text-center">
        <thead class="table-light">
          <tr>
            <th class="text-secondary">Tipo</th>
            <th class="text-secondary">Subtipo</th>
            <th class="text-secondary">Linea</th>
            <th class="text-secondary">Folio</th>
            <th class="text-secondary">Dictamen</th>
            <th class="text-secondary">Fecha de calibracion</th>
            <th class="text-secondary">Vencimiento</th>
            <th class="text-secondary">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reporte in reportesPaginados" :key="reporte.id">
            <td>{{ reporte.tipo }}</td>
            <td>{{ reporte.subtipo }}</td>
            <td>{{ reporte.linea }}</td>
            <td>{{ reporte.folio }}</td>
            <td>{{ formatoFecha(reporte.dictamen) }}</td>
            <td>{{ formatoFecha(reporte.calibracion) }}</td>
            <td>{{ formatoFecha(reporte.vencimiento) }}</td>
            <td>
              <!-- Si ya tiene PDF -->
              <template v-if="reporte.pdfUrl">
                <a :href="reporte.pdfUrl" target="_blank" class="btn btn-sm btn-outline-success">
                  Ver PDF
                </a>
              </template>

              <!-- Si no tiene PDF -->
              <template v-else>
                <button class="btn btn-sm btn-outline-primary" @click="abrirModalPdf(reporte)">
                  Subir PDF
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vista móvil -->
    <div class="d-md-none">
      <div v-for="reporte in reportesPaginados" :key="reporte.id" class="border rounded-3 shadow-sm mb-3 p-3">
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Tipo</span>
          <span class="fw-semibold text-dark">{{ reporte.tipo }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Subtipo</span>
          <span class="fw-semibold text-dark">{{ reporte.subtipo }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Linea</span>
          <span class="fw-semibold text-dark">{{ reporte.linea }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Folio</span>
          <span class="fw-semibold text-dark">{{ reporte.folio }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Dictamen</span>
          <span class="fw-semibold text-dark">{{ formatoFecha(reporte.dictamen) }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted small">Fecha de calibracion</span>
          <span class="fw-semibold text-dark">{{ formatoFecha(reporte.calibracion) }}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted small">Vencimiento</span>
          <span class="fw-semibold text-danger">{{
            formatoFecha(reporte.vencimiento)
          }}</span>
        </div>
      </div>
    </div>
    <div class="modal fade" id="modalPdf" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="guardarPdf">
          <div class="modal-header">
            <h5 class="modal-title">Agregar PDF al reporte</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="file" accept="application/pdf" class="form-control" @change="onPdfChange" />
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-success">Guardar PDF</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Paginación -->
    <nav class="mt-3">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li class="page-item disabled">
          <span class="page-link">Página {{ paginaActual }}</span>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual >= totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import { db } from "../../servivces/auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import dayjs from "dayjs";
import { watch } from "vue";
import Swal from "sweetalert2";
function formatoFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  const f = dayjs(fecha);

  return f.isValid()
    ? f.format("DD/MM/YYYY")
    : "Sin fecha";
}

const user = JSON.parse(localStorage.getItem("user"));
const centroId = user?.centroId || "sin-centro";
const reporteSeleccionado = ref(null);
const pdfFile = ref(null);
const centro = ref(null);
const guardandoPdf = ref(false);
const guardandoReporte = ref(false);
const pdfInput = ref(null);

const cargarCentro = async () => {
  if (!centroId) return;
  const snapshot = await getDocs(collection(db, "centros"));
  const centros = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  centro.value = centros.find((c) => c.id === centroId);
};
function abrirModalPdf(reporte) {
  reporteSeleccionado.value = reporte;
  pdfFile.value = null;

  if (pdfInput.value) {
    pdfInput.value.value = "";
  }

  const modal = new bootstrap.Modal(
    document.getElementById("modalPdf")
  );

  modal.show();
}

const nuevo = ref({
  tipo: "",
  subtipo: "",
  linea: "",
  folio: "",
  dictamen: "",
  calibracion: "",
  vencimiento: "",
  pdfFile: null,
});
function onFileChange(e) {
  const file = e.target.files[0];
  if (file && file.type === "application/pdf") {
    nuevo.value.pdfFile = file; //aquí se guarda el File
  } else {
    Swal.fire({
      icon: "error",
      title: "Archivo inválido",
      text: "Solo se permiten archivos PDF.",
    });
    e.target.value = "";
  }
}

const reportesLab = ref([]);

const calibraciones = {
  ANALIZADORES: {
    aplica: "todasLineas",
    frecuencia: { meses: 3 },
    subtipos: ["Analizadores"],
  },
  OPACIMETRO: {
    aplica: "lineaDual",
    frecuencia: { meses: 3 },
    subtipos: ["Opacímetro"],
  },
  DINAMOMETROS: {
    aplica: "todasLineas",
    frecuencia: { meses: 6 },
    subtipos: ["Celda de carga", "Rodillo, brazo y palanca", "Parásitas", "Dinamómetro"],
  },
  "DINAMOMETROS MENSUALES": {
    aplica: "todasLineas",
    frecuencia: { meses: 1 },
    subtipos: ["KEYTRONIS SA DE CV", "SDE (SISTEMA DE DIAGNOSTICO Y EVALUCION)"],
  },
  TACOMETROS: {
    aplica: "todasLineas",
    frecuencia: { años: 1 },
    subtipos: ["Pinza", "Batería", "No. Contacto"],
  },
  "ESTACIÓN METEOROLÓGICA 1": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Humedad", "Presión", "Temperatura"],
  },
  "ESTACIÓN METEOROLÓGICA 2": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Humedad", "Presión", "Temperatura"],
  },
  DIESEL: {
    aplica: "lineaDual",
    frecuencia: { años: 1 },
    subtipos: ["Termocopla", "Lector óptico"],
  },
  "MANOMETROS LINEAS": {
    aplica: "todasLineas",
    frecuencia: { años: 1 },
    subtipos: ["Cero", "Media", "Baja"],
  },
  "MANOMETRO COMPRESOR": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: [],
  },
  "MANOMETROS CUARTO DE GASES (PRESION EN LINEA)": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Cero", "Media", "Baja"],
  },
  "MANOMETROS CUARTO DE GASES (PRESION EN TANQUE)": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: ["Cero", "Media", "Baja"],
  },
  "VALVULA DE ALIVIO (COMPRESOR)": {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: [],
  },
  PESAS: {
    aplica: "centro",
    frecuencia: { años: 1 },
    subtipos: [],
  },
  "FILTRO DE CALIBRACIÓN": {
    aplica: "lineaDual",
    frecuencia: { años: 1 },
    subtipos: [],
  },
};

const guardarReporteLab = async () => {
  if (guardandoReporte.value) return;

  guardandoReporte.value = true;

  const config = calibraciones[nuevo.value.tipo];

  const reporte = {
    tipo: nuevo.value.tipo,
    subtipo: nuevo.value.subtipo,
    folio: nuevo.value.folio,
    dictamen: nuevo.value.dictamen,
    calibracion: nuevo.value.calibracion,
    vencimiento: nuevo.value.vencimiento,
    centroId,
  };

  if (config?.aplica === "todasLineas") {
    reporte.linea = nuevo.value.linea;
  }

  if (config?.aplica === "lineaDual") {
    reporte.linea = centro.value.lineaDual;
  }

  if (config?.aplica === "centro") {
    reporte.linea = null;
  }

  try {
    // ==========================
    // BUSCAR REGISTRO EXISTENTE
    // ==========================

    const q = query(
      collection(db, "ReporteLab"),
      where("centroId", "==", centroId),
      where("tipo", "==", reporte.tipo),
      where("subtipo", "==", reporte.subtipo),
      where("linea", "==", reporte.linea)
    );

    const existenteSnap = await getDocs(q);

    if (!existenteSnap.empty) {
      const respuesta = await Swal.fire({
        icon: "warning",
        title: "Calibración existente",
        html: `
          Ya existe una calibración para:
          <br><br>
          <b>${reporte.tipo}</b> /
          <b>${reporte.subtipo}</b>
          <br>
          Línea: <b>${reporte.linea ?? "N/A"}</b>
          <br><br>
          ¿Deseas reemplazarla?
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, reemplazar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

      if (!respuesta.isConfirmed) {
        return;
      }

      const anteriorDoc = existenteSnap.docs[0];
      const anteriorData = anteriorDoc.data();

      // ==========================
      // ELIMINAR PDF ANTERIOR
      // ==========================

      if (anteriorData.pdfPath) {
        try {
          const storage = getStorage();

          const archivoAnteriorRef = storageRef(
            storage,
            anteriorData.pdfPath
          );

          await deleteObject(archivoAnteriorRef);

          console.log("PDF anterior eliminado");
        } catch (error) {
          console.warn(
            "No se pudo eliminar el PDF anterior",
            error
          );
        }
      }

      // ==========================
      // ELIMINAR DOCUMENTO ANTERIOR
      // ==========================

      await deleteDoc(
        doc(db, "ReporteLab", anteriorDoc.id)
      );
    }

    // ==========================
    // SUBIR NUEVO PDF
    // ==========================

    let pdfUrl = null;
    let pdfPath = null;

    if (nuevo.value.pdfFile) {
      const storage = getStorage();

      const refPdf = storageRef(
        storage,
        `reportesLaboratorio/${nuevo.value.folio}-${Date.now()}-${nuevo.value.pdfFile.name}`
      );

      await uploadBytes(refPdf, nuevo.value.pdfFile);

      pdfUrl = await getDownloadURL(refPdf);

      pdfPath = refPdf.fullPath;
    }

    // ==========================
    // GUARDAR NUEVO REGISTRO
    // ==========================

    await addDoc(collection(db, "ReporteLab"), {
      ...reporte,
      pdfUrl,
      pdfPath,
    });

    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "La calibración fue guardada correctamente.",
    });

    nuevo.value = {
      tipo: "",
      subtipo: "",
      folio: "",
      dictamen: "",
      calibracion: "",
      vencimiento: "",
      linea: "",
      pdfFile: null,
    };

    pdfFile.value = null;

    if (pdfInput.value) {
      pdfInput.value.value = "";
    }
    bootstrap.Modal.getInstance(
      document.getElementById("modalLab")
    ).hide();

    cargarReportesLab();

  } catch (error) {
    console.error(
      "[Error al guardar reporte de laboratorio]",
      error
    );

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el reporte de laboratorio.",
    });
  } finally {
    guardandoReporte.value = false;
  }
};

function onPdfChange(e) {
  const file = e.target.files[0];

  if (file && file.type === "application/pdf") {
    pdfFile.value = file;
  } else {
    pdfFile.value = null;

    Swal.fire({
      icon: "error",
      title: "Archivo inválido",
      text: "Solo se permiten archivos PDF.",
    });

    e.target.value = "";
  }
}
async function guardarPdf() {
  if (!pdfFile.value || !reporteSeleccionado.value) return;

  try {
    const storage = getStorage();
    const refPdf = storageRef(
      storage,
      `reportesLaboratorio/${reporteSeleccionado.value.folio}-${Date.now()}-${pdfFile.value.name
      }`
    );
    await uploadBytes(refPdf, pdfFile.value);
    const pdfUrl = await getDownloadURL(refPdf);

    const reporteRef = doc(db, "ReporteLab", reporteSeleccionado.value.id);
    await updateDoc(reporteRef, {
      pdfUrl,
      pdfPath: refPdf.fullPath,
    });

    Swal.fire({
      icon: "success",
      title: "PDF agregado",
      text: "El archivo PDF fue agregado correctamente.",
    });

    bootstrap.Modal.getInstance(
      document.getElementById("modalPdf")
    ).hide();

    pdfFile.value = null;

    if (pdfInput.value) {
      pdfInput.value.value = "";
    }
    cargarReportesLab(); // refresca la tabla
  } catch (error) {
    console.error("[Error al guardar PDF]", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el PDF.",
    });
  }
}
const cargarReportesLab = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId;

  if (!centroId) {
    console.warn("[⚠️ No se encontró centroId para el usuario]");
    reportesLab.value = [];
    return;
  }

  const snapshot = await getDocs(collection(db, "ReporteLab"));
  const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  reportesLab.value = todos
    .filter((r) => r.centroId === centroId)
    .sort((a, b) => new Date(b.dictamen) - new Date(a.dictamen));
};

const abrirModal = () => {
  new bootstrap.Modal(document.getElementById("modalLab")).show();
};

const paginaActual = ref(1);
const porPagina = 10;

const reportesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return reportesLab.value.slice(inicio, inicio + porPagina);
});
watch([() => nuevo.value.calibracion, () => nuevo.value.tipo], ([fecha, tipo]) => {
  if (!fecha || !tipo || !calibraciones[tipo]) return;

  const config = calibraciones[tipo];
  let vencimiento = dayjs(fecha);

  if (config.frecuencia.años) {
    vencimiento = vencimiento.add(config.frecuencia.años, "year");
  } else if (config.frecuencia.meses) {
    vencimiento = vencimiento.add(config.frecuencia.meses, "month");
  }

  nuevo.value.vencimiento = vencimiento.format("YYYY-MM-DD");
});
const totalPaginas = computed(() => {
  return Math.ceil(reportesLab.value.length / porPagina);
});

onMounted(() => {
  cargarReportesLab();
  cargarCentro();
});
</script>
