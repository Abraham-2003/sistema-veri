<template>
  <div class="container py-4">
    <h2 class="titulo">Vencimientos por Centro</h2>
    <div class="d-flex gap-2 mb-3">

      <button class="btn btn-success" @click="descargarReporteFaltantes">
        <i class="fas fa-file-excel me-2"></i>
        Descargar reporte de calibraciones faltantes
      </button>

      <button class="btn btn-danger" @click="descargarReporteVencidos">
        <i class="fas fa-file-excel me-2"></i>
        Descargar calibraciones vencidas
      </button>

    </div>

    <div class="grid-centros">
      <div v-for="centro in centrosConRiesgo" :key="centro.id" class="centro-card" :class="centro.riesgo.clase"
        @click="verDetalleCentro(centro)">
        <div class="centro-header">
          <h3>{{ centro.ubicacion }}</h3>
          <span class="badge" :class="centro.riesgo.badge">
            {{ centro.riesgo.texto }}
          </span>
        </div>

        <p class="encargado">
          Responsable:
          <span class="nombre">{{ nombreEncargado(centro.encargado) }}</span>
        </p>

        <div class="vencimiento-info">
          <strong>Próximo vencimiento:</strong>
          <span>{{ centro.riesgo.fecha }}</span>
        </div>

        <div v-if="centro.riesgo.dias <= 30" class="alerta">
          {{ centro.riesgo.dias }} días restantes
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import XLSX from "xlsx-js-style";

const router = useRouter();

const centros = ref([]);
const reportesLab = ref([]);
const gerentes = ref([]);
// ==================== CALIBRACIONES ====================

const CALIBRACIONES = {
  ANALIZADORES: {
    aplica: "todasLineas",
    subtipos: ["Analizadores"],
  },

  OPACIMETRO: {
    aplica: "lineaDual",
    subtipos: ["Opacímetro"],
  },

  DINAMOMETROS: {
    aplica: "todasLineas",
    subtipos: [
      "Celda de carga",
      "Rodillo, brazo y palanca",
      "Parásitas",
      "Dinamómetro",
    ],
  },

  "DINAMOMETROS MENSUALES": {
    aplica: "todasLineas",
    subtipos: [
      "KEYTRONIS SA DE CV",
      "SDE (SISTEMA DE DIAGNOSTICO Y EVALUCION)",
    ],
  },

  TACOMETROS: {
    aplica: "todasLineas",
    subtipos: [
      "Pinza",
      "Batería",
      "No. Contacto",
    ],
  },

  "ESTACIÓN METEOROLÓGICA 1": {
    aplica: "centro",
    subtipos: [
      "Humedad",
      "Presión",
      "Temperatura",
    ],
  },

  "ESTACIÓN METEOROLÓGICA 2": {
    aplica: "centro",
    subtipos: [
      "Humedad",
      "Presión",
      "Temperatura",
    ],
  },

  DIESEL: {
    aplica: "lineaDual",
    subtipos: [
      "Termocopla",
      "Lector óptico",
    ],
  },

  "MANOMETROS LINEAS": {
    aplica: "todasLineas",
    subtipos: [
      "Cero",
      "Media",
      "Baja",
    ],
  },

  "MANOMETRO COMPRESOR": {
    aplica: "centro",
    subtipos: [],
  },

  "MANOMETROS CUARTO DE GASES (PRESION EN LINEA)": {
    aplica: "centro",
    subtipos: [
      "Cero",
      "Media",
      "Baja",
    ],
  },

  "MANOMETROS CUARTO DE GASES (PRESION EN TANQUE)": {
    aplica: "centro",
    subtipos: [
      "Cero",
      "Media",
      "Baja",
    ],
  },

  "VALVULA DE ALIVIO (COMPRESOR)": {
    aplica: "centro",
    subtipos: [],
  },

  PESAS: {
    aplica: "centro",
    subtipos: [],
  },

  "FILTRO DE CALIBRACIÓN": {
    aplica: "lineaDual",
    subtipos: [],
  },
};

const crearIndiceReportes = () => {

  const indice = new Map();

  reportesLab.value.forEach(r => {

    const key = [
      r.centroId,
      r.tipo,
      r.subtipo ?? "",
      r.linea ?? "CENTRO"
    ].join("|");

    indice.set(key, true);

  });

  return indice;

};

const generarEsperadas = (centro) => {

  const lista = [];

  Object.entries(CALIBRACIONES).forEach(([tipo, config]) => {

    if (config.aplica === "centro") {

      if (config.subtipos.length) {

        config.subtipos.forEach(subtipo => {

          lista.push({

            centroId: centro.id,

            centro: centro.ubicacion,

            tipo,

            subtipo,

            linea: "CENTRO"

          });

        });

      } else {

        lista.push({

          centroId: centro.id,

          centro: centro.ubicacion,

          tipo,

          subtipo: "",

          linea: "CENTRO"

        });

      }

    }

    if (config.aplica === "todasLineas") {

      for (let linea = 1; linea <= centro.lineas; linea++) {

        if (config.subtipos.length) {

          config.subtipos.forEach(subtipo => {

            lista.push({

              centroId: centro.id,

              centro: centro.ubicacion,

              tipo,

              subtipo,

              linea

            });

          });

        } else {

          lista.push({

            centroId: centro.id,

            centro: centro.ubicacion,

            tipo,

            subtipo: "",

            linea

          });

        }

      }

    }

    if (config.aplica === "lineaDual") {

      if (!centro.lineaDual) return;

      if (config.subtipos.length) {

        config.subtipos.forEach(subtipo => {

          lista.push({

            centroId: centro.id,

            centro: centro.ubicacion,

            tipo,

            subtipo,

            linea: centro.lineaDual

          });

        });

      } else {

        lista.push({

          centroId: centro.id,

          centro: centro.ubicacion,

          tipo,

          subtipo: "",

          linea: centro.lineaDual

        });

      }

    }

  });

  return lista;

};

const obtenerFaltantes = () => {

  const indice = crearIndiceReportes();

  const faltantes = [];

  centros.value.forEach(centro => {

    const esperadas = generarEsperadas(centro);

    esperadas.forEach(item => {

      const key = [

        item.centroId,

        item.tipo,

        item.subtipo,

        item.linea

      ].join("|");

      if (!indice.has(key)) {

        faltantes.push({

          centro: item.centro,

          linea: item.linea,

          tipo: item.tipo,

          subtipo: item.subtipo || "-"

        });

      }

    });

  });

  return faltantes;

};

/* 🔹 Cargas */
const cargarCentros = async () => {
  const snap = await getDocs(collection(db, "centros"));
  centros.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const cargarReportesLab = async () => {
  const snap = await getDocs(collection(db, "ReporteLab"));
  reportesLab.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const cargarGerentes = async () => {
  const snap = await getDocs(collection(db, "usuarios"));
  gerentes.value = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.rol === "Gerente");
};


const nombreEncargado = (id) => {
  const g = gerentes.value.find((x) => x.id === id);
  return g ? g.nombre : "Sin asignar";
};

/* 🔹 Cálculo de riesgo */
const centrosConRiesgo = computed(() => {
  return centros.value.map((centro) => {
    const reportesCentro = reportesLab.value.filter(
      (r) => r.centroId === centro.id && r.vencimiento
    );

    if (reportesCentro.length === 0) {
      return {
        ...centro,
        riesgo: {
          dias: null,
          texto: "Sin reportes",
          fecha: "—",
          clase: "ok",
          badge: "badge-verde",
        },
      };
    }

    const fechas = reportesCentro.map((r) => dayjs(r.vencimiento));

    const proximo = fechas.sort((a, b) => a.diff(b))[0];
    const dias = proximo.diff(dayjs(), "day");

    if (dias <= 7) {
      return buildRiesgo(centro, dias, proximo, "Crítico", "critico", "badge-rojo");
    }

    if (dias <= 30) {
      return buildRiesgo(centro, dias, proximo, "Próximo", "proximo", "badge-amarillo");
    }

    return buildRiesgo(centro, dias, proximo, "En regla", "ok", "badge-verde");
  });
});

const buildRiesgo = (centro, dias, fecha, texto, clase, badge) => ({
  ...centro,
  riesgo: {
    dias,
    texto,
    fecha: fecha.format("DD/MM/YYYY"),
    clase,
    badge,
  },
});

/* 🔹 Navegación */
const verDetalleCentro = (centro) => {
  router.push({
    name: "ReportesLaboratorioCentroAdmin",
    params: { centroId: centro.id },
  });
};
const descargarReporteVencidos = () => {
  if (!reportesLab.value.length) {
    alert("No hay reportes de laboratorio cargados");
    return;
  }

  const hoy = dayjs().startOf("day");

  // Obtener únicamente reportes vencidos
  const vencidos = reportesLab.value.filter((r) => {
    if (!r.vencimiento) return false;

    const fechaVencimiento = dayjs(r.vencimiento);

    return fechaVencimiento.isBefore(hoy, "day");
  });

  if (!vencidos.length) {
    alert("No existen calibraciones vencidas");
    return;
  }

  // =====================================================
  // CONSTRUIR INFORMACIÓN PARA EXCEL
  // =====================================================

  const datosExcel = vencidos.map((reporte) => {
    const centro = centros.value.find(
      (c) => c.id === reporte.centroId
    );

    const fechaVencimiento = dayjs(reporte.vencimiento);

    const diasVencido = hoy.diff(fechaVencimiento, "day");

    return {
      "Centro": centro?.ubicacion || "Centro no encontrado",

      "Tipo": reporte.tipo || "—",

      "Subtipo": reporte.subtipo || "—",

      "Folio": reporte.folio || "—",

      "Fecha Calibración": reporte.calibracion || "—",

      "Fecha Dictamen": reporte.dictamen || "—",

      "Fecha Vencimiento": reporte.vencimiento || "—",

      "Días Vencido": diasVencido,

      "PDF": reporte.pdfUrl || "—",
    };
  });

  // =====================================================
  // CREAR EXCEL
  // =====================================================

  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(datosExcel);

  // =====================================================
  // ESTILO
  // =====================================================

  const rango = XLSX.utils.decode_range(ws["!ref"]);

  // Encabezados
  for (let C = rango.s.c; C <= rango.e.c; C++) {
    const celda = ws[
      XLSX.utils.encode_cell({
        r: 0,
        c: C,
      })
    ];

    if (!celda) continue;

    celda.s = {
      font: {
        bold: true,
        color: "FFFFFF",
        sz: 11,
      },
      fill: {
        fgColor: {
          rgb: "9C0006",
        },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    };
  }

  // Filas
  for (let R = 1; R <= rango.e.r; R++) {
    for (let C = rango.s.c; C <= rango.e.c; C++) {
      const celda = ws[
        XLSX.utils.encode_cell({
          r: R,
          c: C,
        })
      ];

      if (!celda) continue;

      celda.s = {
        alignment: {
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: {
            style: "thin",
            color: {
              rgb: "D9D9D9",
            },
          },
        },
      };
    }

    // Resaltar días vencidos
    const indiceDiasVencido = datosExcel[0]
      ? Object.keys(datosExcel[0]).indexOf("Días Vencido")
      : -1;

    if (indiceDiasVencido >= 0) {
      const celdaDias = ws[
        XLSX.utils.encode_cell({
          r: R,
          c: indiceDiasVencido,
        })
      ];

      if (celdaDias) {
        celdaDias.s = {
          font: {
            bold: true,
            color: "9C0006",
          },
          fill: {
            fgColor: {
              rgb: "FFC7CE",
            },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    }
  }

  // =====================================================
  // ANCHOS DE COLUMNAS
  // =====================================================

  ws["!cols"] = [
    { wch: 25 }, // Centro
    { wch: 38 }, // Tipo
    { wch: 15 }, // Subtipo
    { wch: 20 }, // Folio
    { wch: 18 }, // Calibración
    { wch: 18 }, // Dictamen
    { wch: 20 }, // Vencimiento
    { wch: 15 }, // Días vencido
    { wch: 60 }, // PDF
  ];

  // Congelar encabezado
  ws["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  // Filtro
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range(rango),
  };

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Calibraciones Vencidas"
  );

  // =====================================================
  // NOMBRE DEL ARCHIVO
  // =====================================================

  const fechaActual = dayjs().format("YYYY-MM-DD");

  const fileName = `Calibraciones_Vencidas_${fechaActual}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
const descargarReporteFaltantes = () => {

  const faltantes = obtenerFaltantes();

  if (!faltantes.length) {

    Swal.fire({

      icon: "success",

      title: "Excelente",

      text: "No existen calibraciones faltantes."

    });

    return;

  }

  //---------------------------------

  // Hoja detalle

  //---------------------------------

  const detalle = faltantes.map(f => ({

    Centro: f.centro,

    Línea: f.linea,

    Tipo: f.tipo,

    Subtipo: f.subtipo,

    Estado: "FALTANTE"

  }));

  //---------------------------------

  // Hoja resumen

  //---------------------------------

  const resumenMap = {};

  faltantes.forEach(f => {

    if (!resumenMap[f.centro]) {

      resumenMap[f.centro] = 0;

    }

    resumenMap[f.centro]++;

  });

  const resumen = Object.keys(resumenMap).map(c => ({

    Centro: c,

    "Total faltantes": resumenMap[c]

  }));

  //---------------------------------

  const wb = XLSX.utils.book_new();

  //---------------------------------

  const wsDetalle = XLSX.utils.json_to_sheet(detalle);

  wsDetalle["!cols"] = [

    { wch: 30 },

    { wch: 10 },

    { wch: 35 },

    { wch: 35 },

    { wch: 15 }

  ];

  wsDetalle["!autofilter"] = {

    ref: "A1:E1"

  };

  //---------------------------------

  const wsResumen = XLSX.utils.json_to_sheet(resumen);

  wsResumen["!cols"] = [

    { wch: 35 },

    { wch: 20 }

  ];

  //---------------------------------

  XLSX.utils.book_append_sheet(

    wb,

    wsResumen,

    "Resumen"

  );

  XLSX.utils.book_append_sheet(

    wb,

    wsDetalle,

    "Detalle"

  );

  //---------------------------------

  const pintarEncabezado = (ws, columnas) => {

    columnas.forEach(c => {

      if (!ws[c]) return;

      ws[c].s = {

        font: {

          bold: true,

          color: {

            rgb: "FFFFFF"

          }

        },

        fill: {

          fgColor: {

            rgb: "1565C0"

          }

        },

        alignment: {

          horizontal: "center",

          vertical: "center"

        },

        border: {

          top: { style: "thin" },

          bottom: { style: "thin" },

          left: { style: "thin" },

          right: { style: "thin" }

        }

      };

    });

  };

  pintarEncabezado(

    wsDetalle,

    ["A1", "B1", "C1", "D1", "E1"]

  );

  pintarEncabezado(

    wsResumen,

    ["A1", "B1"]

  );

  //---------------------------------

  XLSX.writeFile(

    wb,

    `Reporte_Faltantes_${dayjs().format("YYYY-MM-DD")}.xlsx`

  );

};

onMounted(() => {
  cargarCentros();
  cargarReportesLab();
  cargarGerentes();
});
</script>
<style scoped>
.titulo {
  font-size: 1.9rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.grid-centros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.6rem;
}

/* Card */
.centro-card {
  background: #fff;
  border-radius: 18px;
  padding: 1.4rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 6px solid transparent;
}

.centro-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.15);
}

/* Header */
.centro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.centro-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}

/* Badge */
.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-verde {
  background: #d4edda;
  color: #155724;
}

.badge-amarillo {
  background: #fff3cd;
  color: #856404;
}

.badge-rojo {
  background: #f8d7da;
  color: #721c24;
}

/* Texto */
.encargado {
  font-size: 0.9rem;
  margin: 0.8rem 0;
  color: #7f8c8d;
}

.nombre {
  font-weight: 600;
  color: #2c3e50;
}

.vencimiento-info {
  font-size: 0.9rem;
  color: #34495e;
}

/* Alerta */
.alerta {
  margin-top: 1rem;
  text-align: center;
  padding: 0.6rem;
  border-radius: 10px;
  background: #fdecea;
  color: #842029;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
