import { db } from "../servivces/auth";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from "firebase/firestore";


import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import html2pdf from "html2pdf.js";

dayjs.extend(utc);
dayjs.extend(timezone);
const HORA_CORTE = 15;
const LIMITE_CONSUMO = 120;
const TIMEZONE = "America/Mexico_City";
const TIPOS_GAS = ["Baja", "Media", "Cero"];

/* ======================================================
   OBTENER REPORTES DEL CENTRO
====================================================== */

export const obtenerReportesCentro = async (centroId) => {
    try {
        const ayer = dayjs().subtract(1, "day").startOf("day").toISOString();

        const hoy = dayjs().endOf("day").toISOString();

        const q = query(
            collection(db, "reportes"),
            where("centroId", "==", centroId),
            where("fecha", ">=", ayer),
            where("fecha", "<=", hoy),
            orderBy("fecha", "asc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error obteniendo reportes:", error);
        throw error;
    }
};

/* ======================================================
   CLASIFICAR REPORTES
====================================================== */
const generarComparativa = ({
    reporteInicial,
    reporteFinal,
    etiqueta,
}) => {
    const comparativa = [];

    TIPOS_GAS.forEach((tipoGas) => {
        const inicial =
            reporteInicial?.gases?.uso?.[tipoGas]?.[0];

        const final =
            reporteFinal?.gases?.uso?.[tipoGas]?.[0];

        const psiInicial = Number(inicial?.psi || 0);

        const psiFinal = Number(final?.psi || 0);

        comparativa.push({
            gas: tipoGas,

            inicial: psiInicial,

            final: psiFinal,

            diferencia: psiInicial - psiFinal,

            etiqueta,
        });
    });

    return comparativa;
};

export const clasificarReportes = (reportes) => {
    const hoy = dayjs().format("YYYY-MM-DD");

    const ayer = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    const resultado = {
        aperturaHoy: null,
        cierreHoy: null,
        aperturaAyer: null,
        cierreAyer: null,

        incidenciasSistema: [],
    };

    const aperturasHoy = [];
    const cierresHoy = [];

    const aperturasAyer = [];
    const cierresAyer = [];

    reportes.forEach((r) => {
        if (!r.fecha) return;

        const fecha = dayjs.utc(r.fecha).tz(TIMEZONE);

        const dia = fecha.tz(TIMEZONE).format("YYYY-MM-DD");

        const hora = fecha.hour();

        const esApertura = hora < HORA_CORTE;

        if (dia === hoy) {
            if (esApertura) {
                aperturasHoy.push(r);
            } else {
                cierresHoy.push(r);
            }
        }

        if (dia === ayer) {
            if (esApertura) {
                aperturasAyer.push(r);
            } else {
                cierresAyer.push(r);
            }
        }
        console.log({
            original: r.fecha,
            local: fecha.format("YYYY-MM-DD HH:mm:ss"),
            hora,
        });
    });

    /* ======================================================
       DETECTAR DUPLICADOS
    ====================================================== */

    if (aperturasHoy.length > 1) {
        resultado.incidenciasSistema.push({
            tipo: "Reportes duplicados",
            descripcion: `Se detectaron ${aperturasHoy.length} reportes de apertura el día de hoy.`,
        });
    }

    if (cierresHoy.length > 1) {
        resultado.incidenciasSistema.push({
            tipo: "Reportes duplicados",
            descripcion: `Se detectaron ${cierresHoy.length} reportes de cierre el día de hoy.`,
        });
    }

    if (aperturasAyer.length > 1) {
        resultado.incidenciasSistema.push({
            tipo: "Reportes duplicados",
            descripcion: `Se detectaron ${aperturasAyer.length} reportes de apertura el día anterior.`,
        });
    }

    if (cierresAyer.length > 1) {
        resultado.incidenciasSistema.push({
            tipo: "Reportes duplicados",
            descripcion: `Se detectaron ${cierresAyer.length} reportes de cierre el día anterior.`,
        });
    }

    /* ======================================================
       TOMAR EL MÁS RECIENTE
    ====================================================== */

    resultado.aperturaHoy = aperturasHoy.at(-1) || null;

    resultado.cierreHoy = cierresHoy.at(-1) || null;

    resultado.aperturaAyer = aperturasAyer.at(-1) || null;

    resultado.cierreAyer = cierresAyer.at(-1) || null;

    return resultado;
};

/* ======================================================
   OBTENER GAS
====================================================== */

const obtenerGas = (reporte, tipo) => {
    if (!reporte) return null;

    return reporte?.gases?.uso?.[tipo]?.[0] || null;
};

/* ======================================================
   GENERAR INCIDENCIAS
====================================================== */

export const generarIncidencias = ({
    aperturaHoy,
    cierreAyer,
    aperturaAyer,
    incidenciasSistema = [],
}) => {
    const incidencias = [...incidenciasSistema];

    /* ======================================================
       VALIDAR EXISTENCIA DE REPORTES
    ====================================================== */

    if (!aperturaHoy) {
        incidencias.push({
            tipo: "Reporte faltante",
            descripcion: "No se encontró el reporte de apertura del día actual.",
        });

        return incidencias;
    }

    if (!cierreAyer) {
        incidencias.push({
            tipo: "Reporte faltante",
            descripcion: "No se encontró el reporte de cierre del día anterior.",
        });

        return incidencias;
    }

    if (!aperturaAyer) {
        incidencias.push({
            tipo: "Reporte faltante",
            descripcion: "No se encontró el reporte de apertura del día anterior.",
        });
    }

    /* ======================================================
       COMPARAR GASES
    ====================================================== */

    TIPOS_GAS.forEach((tipoGas) => {
        const gasAnterior = obtenerGas(cierreAyer, tipoGas);

        const gasActual = obtenerGas(aperturaHoy, tipoGas);

        if (!gasAnterior || !gasActual) {
            incidencias.push({
                tipo: "Gas faltante",
                gas: tipoGas,
                descripcion: `No fue posible comparar el gas ${tipoGas} por falta de información.`,
            });

            return;
        }

        const psiAnterior = Number(gasAnterior.psi || 0);

        const psiActual = Number(gasActual.psi || 0);

        const diferencia = psiAnterior - psiActual;

        /* ======================================================
           LECTURA INCONSISTENTE
        ====================================================== */

        if (diferencia < 0) {
            incidencias.push({
                tipo: "Lectura inconsistente",
                gas: tipoGas,
                descripcion:
                    `La lectura del turno anterior fue de ${psiAnterior} lbs ` +
                    `y en la apertura se reporta ${psiActual} lbs, ` +
                    `generando un incremento de ${Math.abs(diferencia)} lbs sin justificación.`,
            });
        }

        /* ======================================================
           CONSUMO ELEVADO
        ====================================================== */

        if (diferencia > LIMITE_CONSUMO) {
            incidencias.push({
                tipo: "Consumo elevado",
                gas: tipoGas,
                descripcion:
                    `Se detectó un consumo de ${diferencia} lbs ` +
                    `entre el cierre anterior y la apertura actual.`,
            });
        }
    });

    return incidencias;
};

/* ======================================================
   GENERAR REPORTE COMPLETO
====================================================== */

export const generarReporteIncidencias = async (centro) => {
  try {

    const reportes = await obtenerReportesCentro(centro.id);

    const clasificados = clasificarReportes(reportes);

    const incidencias = generarIncidencias(clasificados);

    /* ======================================================
       COMPARATIVA OPERACIÓN
    ====================================================== */

    const comparativaOperacion = generarComparativa({
      reporteInicial: clasificados.aperturaAyer,
      reporteFinal: clasificados.cierreAyer,
      etiqueta: "Operación día anterior",
    });

    /* ======================================================
       COMPARATIVA CONTINUIDAD
    ====================================================== */

    const comparativaContinuidad = generarComparativa({
      reporteInicial: clasificados.cierreAyer,
      reporteFinal: clasificados.aperturaHoy,
      etiqueta: "Continuidad entre turnos",
    });

    return {

      centro: centro.ubicacion,

      encargado:
        centro.encargadoNombre || "Sin encargado",

      fecha: dayjs()
        .tz(TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss"),

      reportes: clasificados,

      comparativaOperacion,

      comparativaContinuidad,

      incidencias,

    };

  } catch (error) {

    console.error(error);

    throw error;
  }
};

/* ======================================================
   GENERAR PDF
====================================================== */

export const descargarPDFIncidencias = async (data) => {
    try {
        const contenedor = document.createElement("div");
        const generarTablaComparativa = (lista) => {
            return lista
                .map(
                    (g) => `
                            <tr>
                            <td>${g.gas}</td>
                            <td>${g.inicial} lbs</td>
                            <td>${g.final} lbs</td>
                            <td>${g.diferencia} lbs</td>
                            </tr>
                        `
                )
                .join("");
        };
        const tablaOperacion = generarTablaComparativa(
            data.comparativaOperacion
        );

        const tablaContinuidad = generarTablaComparativa(
            data.comparativaContinuidad
        );
        const incidenciasHTML =
            data.incidencias.length > 0
                ? data.incidencias
                    .map(
                        (i) => `
          <div class="incidencia">
            <div class="tipo">${i.tipo}</div>

            ${i.gas
                                ? `<div><strong>Gas afectado:</strong> ${i.gas}</div>`
                                : ""
                            }

            <div class="descripcion">
              ${i.descripcion}
            </div>
          </div>
        `
                    )
                    .join("")
                : `
          <div class="sin-incidencias">
            No se detectaron incidencias.
          </div>
        `;

        contenedor.innerHTML = `
<div class="reporte-container">

  <div class="header">

    <div>
      <h1>Reporte de Gases</h1>
      <div class="subtitulo">
        Monitoreo e incidencias operativas
      </div>
    </div>

    <div class="fecha-box">
      ${dayjs().format("DD/MM/YYYY")}
    </div>

  </div>

  <div class="info-card">

    <div class="info-item">
      <span class="label">Centro</span>
      <span class="value">${data.centro}</span>
    </div>

    <div class="info-item">
      <span class="label">Encargado</span>
      <span class="value">${data.encargado}</span>
    </div>

    <div class="info-item">
      <span class="label">Fecha de generación</span>
      <span class="value">${data.fecha}</span>
    </div>

  </div>

  <!-- ===================================================== -->
  <!-- CONSUMO OPERATIVO -->
  <!-- ===================================================== -->

  <section class="section">

    <h2>
      Consumo Operativo del Día Anterior
    </h2>

    <table class="tabla-gases">

      <thead>
        <tr>
          <th>Gas</th>
          <th>Apertura</th>
          <th>Cierre</th>
          <th>Consumo</th>
        </tr>
      </thead>

      <tbody>
        ${tablaOperacion}
      </tbody>

    </table>

  </section>

  <!-- ===================================================== -->
  <!-- CONTINUIDAD -->
  <!-- ===================================================== -->

  <section class="section">

    <h2>
      Validación de Continuidad
    </h2>

    <table class="tabla-gases">

      <thead>
        <tr>
          <th>Gas</th>
          <th>Cierre anterior</th>
          <th>Apertura actual</th>
          <th>Diferencia</th>
        </tr>
      </thead>

      <tbody>
        ${tablaContinuidad}
      </tbody>

    </table>

  </section>

  <!-- ===================================================== -->
  <!-- INCIDENCIAS -->
  <!-- ===================================================== -->

  <section class="section">

    <h2>
      Incidencias Detectadas
    </h2>

    ${incidenciasHTML}

  </section>

</div>
`;

        /* ======================================================
           ESTILOS
        ====================================================== */

        const style = document.createElement("style");

        style.innerHTML = `

*{
  box-sizing:border-box;
}

.reporte-container{
  padding:40px;
  font-family:Arial, sans-serif;
  color:#1f2937;
  background:white;
}

/* ===================================================== */
/* HEADER */
/* ===================================================== */

.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:35px;
  border-bottom:3px solid #dc2626;
  padding-bottom:20px;
}

h1{
  margin:0;
  font-size:32px;
  color:#111827;
}

.subtitulo{
  margin-top:6px;
  color:#6b7280;
  font-size:14px;
}

.fecha-box{
  background:#dc2626;
  color:white;
  padding:10px 16px;
  border-radius:10px;
  font-size:14px;
  font-weight:bold;
}

/* ===================================================== */
/* INFO */
/* ===================================================== */

.info-card{
  display:flex;
  gap:20px;
  margin-bottom:35px;
}

.info-item{
  flex:1;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:18px;
}

.label{
  display:block;
  font-size:12px;
  color:#6b7280;
  margin-bottom:8px;
  text-transform:uppercase;
  letter-spacing:.5px;
}

.value{
  font-size:16px;
  font-weight:bold;
  color:#111827;
}

/* ===================================================== */
/* SECTION */
/* ===================================================== */

.section{
  margin-bottom:40px;
}

h2{
  margin-bottom:16px;
  color:#111827;
  font-size:22px;
}

/* ===================================================== */
/* TABLAS */
/* ===================================================== */

.tabla-gases{
  width:100%;
  border-collapse:collapse;
  overflow:hidden;
  border-radius:12px;
  border:1px solid #e5e7eb;
}

.tabla-gases thead{
  background:#111827;
  color:white;
}

.tabla-gases th{
  padding:14px;
  font-size:14px;
  font-weight:bold;
}

.tabla-gases td{
  padding:14px;
  text-align:center;
  border-top:1px solid #e5e7eb;
  font-size:14px;
}

.tabla-gases tbody tr:nth-child(even){
  background:#f9fafb;
}

/* ===================================================== */
/* INCIDENCIAS */
/* ===================================================== */

.incidencia{
  border:1px solid #fecaca;
  border-left:8px solid #dc2626;
  border-radius:12px;
  padding:18px;
  margin-bottom:18px;
  background:#fef2f2;
}

.tipo{
  font-size:18px;
  font-weight:bold;
  color:#b91c1c;
  margin-bottom:10px;
}

.descripcion{
  margin-top:10px;
  line-height:1.6;
  font-size:14px;
}

.sin-incidencias{
  padding:22px;
  border-radius:12px;
  background:#ecfdf5;
  border:1px solid #6ee7b7;
  color:#065f46;
  font-weight:bold;
  text-align:center;
  font-size:15px;
}

`;
        contenedor.appendChild(style);

        /* ======================================================
           OPCIONES PDF
        ====================================================== */

        const opciones = {
            margin: 0.5,

            filename:
                `Reporte ${data.centro}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`,

            image: {
                type: "jpeg",
                quality: 1,
            },

            html2canvas: {
                scale: 2,
            },

            jsPDF: {
                unit: "in",
                format: "letter",
                orientation: "portrait",
            },
        };

        await html2pdf().set(opciones).from(contenedor).save();
    } catch (error) {
        console.error("Error generando PDF:", error);

        throw error;
    }
};