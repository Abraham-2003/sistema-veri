<template>
  <div class="container py-4">
    <h2 class="titulo">Reportes por Centro</h2>
    <div class="mb-3">
      <button
        class="btn btn-primary"
        :disabled="loadingGeneral"
        @click="generarReporteGeneral"
      >
        <span v-if="loadingGeneral" class="spinner-border spinner-border-sm me-2"></span>

        {{ loadingGeneral ? "Generando reporte..." : "Generar reporte general" }}
      </button>
    </div>
    <div class="grid-centros">
      <div
        v-for="centro in centros"
        :key="centro.id"
        class="centro-card"
        :class="centro.estatus === 'Activo' ? 'activo' : 'desactivado'"
        @click="verReporte(centro.ubicacion)"
      >
        <div class="centro-header">
          <h3>{{ centro.ubicacion }}</h3>
          <span
            class="badge"
            :class="centro.estatus === 'Activo' ? 'badge-verde' : 'badge-rojo'"
          >
            {{ centro.estatus }}
          </span>
        </div>

        <p class="encargado">
          Responsable:
          <span class="nombre">{{ nombreEncargado(centro.encargado) }}</span>
        </p>

        <div v-if="tieneReporteHoy(centro.id)" class="alerta-pendiente">
          Reporte pendiente
        </div>
        <button
          class="btn btn-outline-danger btn-sm mt-2 ms-2"
          @click.stop="descargarReportePDF(centro)"
        >
          Generar PDF
        </button>
        <button
          class="btn btn-outline-success btn-sm mt-2"
          @click.stop="abrirModalExcel(centro)"
        >
          Descargar Excel
        </button>
      </div>
    </div>
    <div class="modal fade" id="modalExcel" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Exportar reportes – {{ centroSeleccionado?.ubicacion }}
            </h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label small">Fecha inicio</label>
              <input
                type="date"
                v-model="fechaInicio"
                class="form-control form-control-sm"
              />
            </div>

            <div class="mb-2">
              <label class="form-label small">Fecha fin</label>
              <input
                type="date"
                v-model="fechaFin"
                class="form-control form-control-sm"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
              Cancelar
            </button>

            <button
              class="btn btn-success btn-sm"
              :disabled="loading"
              @click="descargarExcel"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Descargar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../servivces/auth.js";
import {
  generarReporteIncidencias,
  descargarPDFIncidencias,
} from "../../servivces/reporteIncidencias.js";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import dayjs from "dayjs";
import XLSX from "xlsx-js-style";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const fechaInicio = ref("");
const fechaFin = ref("");
const reportesHoy = ref([]);
const loading = ref(false);
const centroId = ref("");
const loadingGeneral = ref(false);

const cargarReportesHoy = async () => {
  const hoy = dayjs().format("YYYY-MM-DD");
  const snapshot = await getDocs(collection(db, "reportes"));
  reportesHoy.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((r) => dayjs(r.fecha).isSame(hoy, "day"));
};

const centroSeleccionado = ref(null);

const abrirModalExcel = (centro) => {
  centroSeleccionado.value = centro;
  centroId.value = centro.id;
  fechaInicio.value = "";
  fechaFin.value = "";

  new bootstrap.Modal(document.getElementById("modalExcel")).show();
};

const centros = ref([]);
const router = useRouter();

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
const tieneReporteHoy = (centroId) => {
  return reportesHoy.value.some((r) => r.centroId === centroId);
};

const gerentes = ref([]);

const cargarGerentes = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));
  gerentes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((u) => u.rol === "Gerente");
};
const nombreEncargado = (id) => {
  const gerente = gerentes.value.find((g) => g.id === id);
  return gerente ? gerente.nombre : "Sin asignar";
};

const verReporte = (ubicacionCentro) => {
  router.push({ name: "ReporteVeri", params: { ubicacion: ubicacionCentro } });
};

const obtenerReportes = async () => {
  const inicio = dayjs(fechaInicio.value).format("YYYY-MM-DD");
  const fin = dayjs(fechaFin.value).format("YYYY-MM-DD");

  const q = query(
    collection(db, "reportes"),
    where("centroId", "==", centroId.value),
    where("fecha", ">=", inicio),
    where("fecha", "<=", `${fin}T23:59:59`),
    orderBy("fecha", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};
const generarReporteGeneral = async () => {
  try {
    loadingGeneral.value = true;

    const filas = [];

    for (const centro of centros.value) {
      const q = query(
        collection(db, "reportes"),
        where("centroId", "==", centro.id),
        orderBy("fecha", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        filas.push({
          Centro: centro.ubicacion,
          Fecha: "Sin reporte",
        });

        continue;
      }

      const reporte = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };

      const uso = reporte.gases?.uso || {};
      const stock = reporte.gases?.stock || {};

      const bajaUso = uso.Baja?.[0] || {};
      const mediaUso = uso.Media?.[0] || {};
      const ceroUso = uso.Cero?.[0] || {};

      const bajaStock = stock.Baja?.[0] || {};
      const mediaStock = stock.Media?.[0] || {};
      const ceroStock = stock.Cero?.[0] || {};

      filas.push({
        Centro: centro.ubicacion,

        Fecha: dayjs(reporte.fecha).format("YYYY-MM-DD HH:mm"),

        "Baja Uso PSI": bajaUso.psi ?? "",
        "Baja Uso Serie": bajaUso.serie ?? "",

        "Media Uso PSI": mediaUso.psi ?? "",
        "Media Uso Serie": mediaUso.serie ?? "",

        "Cero Uso PSI": ceroUso.psi ?? "",
        "Cero Uso Serie": ceroUso.serie ?? "",

        "Baja Stock PSI": bajaStock.psi ?? "",
        "Baja Stock Serie": bajaStock.serie ?? "",

        "Media Stock PSI": mediaStock.psi ?? "",
        "Media Stock Serie": mediaStock.serie ?? "",

        "Cero Stock PSI": ceroStock.psi ?? "",
        "Cero Stock Serie": ceroStock.serie ?? "",
      });
    }

    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.json_to_sheet(filas);
    const psiColumns = ["C", "E", "G", "I", "K", "M"];

    for (let row = 2; row <= filas.length + 1; row++) {
      psiColumns.forEach((col) => {
        const cell = `${col}${row}`;

        if (!ws[cell]) return;

        const valor = Number(ws[cell].v);

        let color = null;

        if (valor >= 801) {
          color = "C6EFCE";
        } else if (valor >= 501) {
          color = "FFEB9C";
        } else {
          color = "FFC7CE";
        }

        ws[cell].s = {
          ...(ws[cell].s || {}),
          fill: {
            fgColor: { rgb: color },
          },
          alignment: {
            horizontal: "center",
          },
        };
      });
    }
    const aplicarFormatoHoja = (ws) => {
      const range = XLSX.utils.decode_range(ws["!ref"]);

      // Encabezados
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({
          r: 0,
          c,
        });

        if (!ws[cell]) continue;

        ws[cell].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
          },
          fill: {
            fgColor: { rgb: "1F4E78" },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }

      // Filas alternadas
      for (let r = 1; r <= range.e.r; r++) {
        const color = r % 2 === 0 ? "F2F2F2" : "FFFFFF";

        for (let c = 0; c <= range.e.c; c++) {
          const cell = XLSX.utils.encode_cell({
            r,
            c,
          });

          if (!ws[cell]) continue;

          ws[cell].s = ws[cell].s || {};

          // Solo si no tiene color previo
          if (!ws[cell].s.fill) {
            ws[cell].s.fill = {
              fgColor: { rgb: color },
            };
          }
        }
      }

      // Ancho automático
      ws["!cols"] = [
        { wch: 25 }, // centro
        { wch: 20 }, // fecha
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
      ];
    };
    aplicarFormatoHoja(ws);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte General");

    const estado = import.meta.env.VITE_ESTADO;

    XLSX.writeFile(
      wb,
      `Reporte_General_Gases_${estado}_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`
    );
  } catch (error) {
    console.error(error);

    alert("Error generando reporte general");
  } finally {
    loadingGeneral.value = false;
  }
};
const descargarExcel = async () => {
  if (!fechaInicio.value || !fechaFin.value || !centroId.value) {
    alert("Selecciona centro y rango de fechas");
    return;
  }
  const inicio = dayjs(fechaInicio.value).format("YYYY-MM-DD");
  const fin = dayjs(fechaFin.value).format("YYYY-MM-DD");

  loading.value = true;

  try {
    const q = query(
      collection(db, "reportes"),
      where("centroId", "==", centroId.value),
      where("fecha", ">=", inicio),
      where("fecha", "<=", `${fin}T23:59:59`),
      orderBy("fecha", "asc")
    );

    const snapshot = await getDocs(q);
    const reportes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!reportes.length) {
      alert("No hay reportes en ese rango");
      loading.value = false;
      return;
    }

    generarExcel(reportes);
  } catch (error) {
    console.error("Error generando Excel", error);
    alert("Error al generar el reporte");
  } finally {
    loading.value = false;
  }
};
const descargarReportePDF = async (centro) => {
  try {
    loading.value = true;

    const data = await generarReporteIncidencias({
      ...centro,
      encargadoNombre: nombreEncargado(centro.encargado),
    });

    console.log("REPORTE GENERADO:", data);

    await descargarPDFIncidencias(data);
  } catch (error) {
    console.error(error);

    alert("Error generando reporte PDF");
  } finally {
    loading.value = false;
  }
};

const generarExcel = (reportes) => {
  if (!centroSeleccionado.value?.ubicacion) {
    console.error("Centro no seleccionado");
    return;
  }

  const nombreCentro = centroSeleccionado.value?.ubicacion || "Centro";

  const fileName = `Reporte_${nombreCentro}_${fechaInicio.value}_a_${fechaFin.value}.xlsx`;

  const wb = XLSX.utils.book_new();

  const resumen = [];
  const lineas = [];
  const calibraciones = [];
  const gasesStock = [];
  const gasesUso = [];
  const imagenes = [];

  reportes.forEach((r) => {
    resumen.push(transformarResumen(r));
    lineas.push(...transformarLineas(r));
    calibraciones.push(...transformarCalibraciones(r));
    gasesStock.push(...transformarGases(r, "stock"));
    gasesUso.push(...transformarGases(r, "uso"));
    imagenes.push(...transformarImagenes(r));
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineas), "Líneas");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(calibraciones),
    "Calibraciones"
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gasesStock), "Gases Stock");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gasesUso), "Gases Uso");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(imagenes), "Imágenes");

  XLSX.writeFile(wb, fileName);
};
const transformarResumen = (r) => {
  const lineas = Object.values(r.lineas || {});
  return {
    Fecha: dayjs(r.fecha).format("YYYY-MM-DD"),
    LineasTotales: lineas.length,
    LineasFueraServicio: lineas.filter((l) => l.estado === "Fuera de servicio").length,
    Compresor: r.compresor?.estatus || "—",
    Opacímetro: r.opacimetro?.estado || "—",
    Observaciones: r.observaciones || "",
    Imagenes: r.imagenes?.length || 0,
  };
};

const transformarLineas = (r) => {
  return Object.entries(r.lineas || {}).map(([num, l]) => ({
    Fecha: dayjs(r.fecha).format("YYYY-MM-DD"),
    Linea: num,
    Estado: l.estado,
    NumeroReporte: l.numeroReporte || "",
    ReporteFalla: l.reporteFalla || "",
  }));
};
const transformarCalibraciones = (r) => {
  const filas = [];
  Object.entries(r.calibraciones || {}).forEach(([linea, equipos]) => {
    Object.entries(equipos).forEach(([equipo, ok]) => {
      filas.push({
        Fecha: dayjs(r.fecha).format("YYYY-MM-DD"),
        Linea: linea,
        Equipo: equipo,
        Resultado: ok ? "OK" : "No OK",
      });
    });
  });
  return filas;
};
const transformarGases = (r, tipo) => {
  const filas = [];
  const grupo = r.gases?.[tipo] || {};

  Object.values(grupo).forEach((arr) => {
    arr.forEach((t) => {
      filas.push({
        Fecha: dayjs(r.fecha).format("YYYY-MM-DD"),
        Tipo: t.tipo,
        Serie: t.serie,
        PSI: t.psi,
        Estatus: t.estatus,
        Observaciones: t.observaciones || "",
      });
    });
  });

  return filas;
};
const transformarImagenes = (r) => {
  return (r.imagenes || []).map((url) => ({
    Fecha: dayjs(r.fecha).format("YYYY-MM-DD"),
    URL: url,
  }));
};

onMounted(() => {
  cargarCentros();
  cargarGerentes();
  cargarReportesHoy();
});
</script>

<style scoped>
/* Layout general */
.titulo {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.grid-centros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

/* Cards */
.centro-card {
  background: #fff;
  border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.centro-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.centro-card.activo {
  border-color: #28a745;
}

.centro-card.desactivado {
  border-color: #dc3545;
  opacity: 0.9;
}

/* Encabezado */
.centro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.centro-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}

/* Badge */
.badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-verde {
  background: #d4edda;
  color: #155724;
}

.badge-rojo {
  background: #f8d7da;
  color: #721c24;
}

/* Encargado */
.encargado {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0.8rem 0;
}

.nombre {
  font-weight: 600;
  color: #2c3e50;
}

/* Reporte pendiente */
.alerta-pendiente {
  background: #fff3cd;
  color: #856404;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  margin-top: auto;
}
</style>
