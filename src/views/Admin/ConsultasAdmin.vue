<template>
  <div>
    <h3>Consulta Histórica de Gases</h3>
    <label class="form-label">Centro</label>
    <select v-model="centroSeleccionado" class="form-select mb-3">
      <option disabled value="">Selecciona un centro</option>
      <option v-for="centro in centros" :key="centro.id" :value="centro.id">
        {{ centro.nombre }}
      </option>
    </select>

    <div class="d-flex gap-3 mb-3">
      <input type="date" v-model="fechaInicio" class="form-control" />
      <input type="date" v-model="fechaFin" class="form-control" />
      <button class="btn btn-primary" @click="consultarReportes">Consultar</button>
    </div>

    <!-- Tabs -->
    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'gases' }"
          @click="tab = 'gases'"
        >
          Gases
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link"
          :class="{ active: tab === 'lineas' }"
          @click="tab = 'lineas'"
        >
          Líneas
        </button>
      </li>
    </ul>

    <!-- Contenido de Gases -->
    <div v-if="tab === 'gases'">
      <table class="table table-bordered table-sm text-center">
        <thead class="table-light">
          <tr>
            <th>Fecha</th>
            <th>Gases</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, index) in tablaGases" :key="index">
            <td>{{ fila.fecha }}</td>
            <td>
              <div
                v-for="gas in fila.gases
                  .slice()
                  .sort(
                    (a, b) => ordenVisual.indexOf(a.tipo) - ordenVisual.indexOf(b.tipo)
                  )"
                :key="gas.tipo"
                class="d-inline-block text-start border rounded px-3 py-2 me-4 mb-3"
                style="min-width: 250px; background-color: #f8f9fa"
              >
                <div class="fw-bold mb-1">{{ gas.tipo }}</div>

                <div>
                  <small class="text-muted">Inicial</small>:
                  <span :class="gas.descontinuado ? 'text-danger fw-bold' : 'fw-bold'">
                    {{ gas.psiInicial }}
                  </span>
                </div>

                <div>
                  <small class="text-muted">Final</small>:
                  <span class="fw-bold">{{ gas.psiFinal }}</span>
                </div>

                <div>
                  <small class="text-muted">Consumo</small>:
                  <span class="fw-bold">{{ gas.consumo }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Contenido de Líneas -->
    <div v-if="tab === 'lineas'">
      <div v-for="(dia, index) in tablaLineas" :key="index" class="mb-4">
        <h5 class="mb-3 text-muted">{{ dia.fecha }}</h5>
        <div class="d-flex flex-wrap gap-3">
          <div
            v-for="linea in dia.lineas"
            :key="linea.numero"
            class="rounded shadow-sm px-4 py-3 text-center"
            :style="{
              backgroundColor: linea.estado === 'Operativa' ? '#e6f4ea' : '#f0f0f0',
              border: '1px solid #ddd',
              minWidth: '140px',
              flex: '0 0 auto',
            }"
          >
            <div class="fw-semibold mb-1">Línea {{ linea.numero }}</div>
            <div
              :class="{
                'text-success': linea.estado === 'Operativa',
                'text-secondary': linea.estado !== 'Operativa',
              }"
              class="small"
            >
              <i
                :class="{
                  'bi bi-check-circle-fill': linea.estado === 'Operativa',
                  'bi bi-slash-circle': linea.estado !== 'Operativa',
                }"
                class="me-1"
              ></i>
              {{ linea.estado }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import dayjs from "dayjs";

const centros = ref([]);
const centroSeleccionado = ref(null);
const fechaInicio = ref("");
const fechaFin = ref("");
const reportesFiltrados = ref([]);
const tablaGases = ref([]);
const ordenVisual = ["Media - Uso", "Baja - Uso", "Cero - Uso"];
const tab = ref("gases");

// Cargar centros disponibles
async function cargarCentros() {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    nombre: doc.data().ubicacion,
  }));
}
cargarCentros();

async function consultarReportes() {
  if (!centroSeleccionado.value || !fechaInicio.value || !fechaFin.value) {
    console.warn("[⚠️ Faltan filtros]", {
      centro: centroSeleccionado.value,
      inicio: fechaInicio.value,
      fin: fechaFin.value,
    });
    return;
  }

  console.log("[📍 Consultando reportes]", {
    centroId: centroSeleccionado.value,
    desde: fechaInicio.value,
    hasta: fechaFin.value,
  });
  const inicio = dayjs(fechaInicio.value).startOf("day").toISOString();
  const fin = dayjs(fechaFin.value).endOf("day").toISOString();

  const q = query(
    collection(db, "reportes"),
    where("centroId", "==", centroSeleccionado.value),
    where("fecha", ">=", inicio),
    where("fecha", "<=", fin),
    orderBy("fecha")
  );

  const snapshot = await getDocs(q);
  console.log("[📦 Reportes encontrados]", snapshot.size);

  reportesFiltrados.value = snapshot.docs.map((doc) => {
    const data = doc.data();

    const gasesUsoRaw = data.gases?.gasesUso ?? {};
    const gasesUso = Object.values(gasesUsoRaw).flat();
    const lineasRaw = data.lineas ?? {};
    const lineas = Object.entries(lineasRaw).map(([numero, info]) => ({
      numero,
      estado: info.estado || "Desconocido",
    }));
    if (!Array.isArray(gasesUso)) {
      console.warn(
        `[⚠️ Reporte ${doc.id}] gases.gasesUso no es un array válido`,
        gasesUso
      );
    }

    return {
      id: doc.id,
      fecha: data.fecha,
      gasesUso,
      lineas,
    };
  });

  procesarGases();
  procesarLineas();
}

const tablaLineas = ref([]);

function procesarLineas() {
  const agrupadosPorDia = {};

  reportesFiltrados.value.forEach((r) => {
    const dia = dayjs(r.fecha).format("YYYY-MM-DD");
    if (!agrupadosPorDia[dia]) agrupadosPorDia[dia] = [];
    agrupadosPorDia[dia].push(r);
  });

  const resultado = [];
  const diasOrdenados = Object.keys(agrupadosPorDia).sort();

  diasOrdenados.forEach((dia) => {
    const reportesDelDia = agrupadosPorDia[dia].sort((a, b) =>
      dayjs(a.fecha).isBefore(dayjs(b.fecha)) ? -1 : 1
    );

    const ultimo = reportesDelDia[reportesDelDia.length - 1];
    const lineas = ultimo?.lineas ?? [];

    resultado.push({
      fecha: dia,
      lineas,
    });
  });

  tablaLineas.value = resultado;
}

function procesarGases() {
  const agrupadosPorDia = {};

  reportesFiltrados.value.forEach((r) => {
    const dia = dayjs(r.fecha).format("YYYY-MM-DD");
    if (!agrupadosPorDia[dia]) agrupadosPorDia[dia] = [];
    agrupadosPorDia[dia].push(r);
  });

  const resultado = [];
  const diasOrdenados = Object.keys(agrupadosPorDia).sort();

  let psiFinalAnteriorPorTipo = {};

  diasOrdenados.forEach((dia) => {
    const reportesDelDia = agrupadosPorDia[dia].sort((a, b) =>
      dayjs(a.fecha).isBefore(dayjs(b.fecha)) ? -1 : 1
    );

    const primero = reportesDelDia[0];
    const ultimo = reportesDelDia[reportesDelDia.length - 1];

    if (!primero) return;

    const gasesInicial = primero.gasesUso ?? [];
    const gasesFinal = ultimo?.gasesUso ?? [];

    const gasesDelDia = gasesInicial.map((gasInicial) => {
      const tipo = gasInicial.tipo;
      const psiInicial = gasInicial.psi;
      const gasFinal = gasesFinal.find((g) => g.tipo === tipo);
      const psiFinal = gasFinal?.psi ?? "—";

      const consumo = psiFinal !== "—" ? psiInicial - psiFinal : "—";

      const psiAnterior = psiFinalAnteriorPorTipo[tipo];
      const esContinuo =
        psiAnterior !== undefined && Number(psiInicial) === Number(psiAnterior);

      return {
        tipo,
        psiInicial,
        psiFinal,
        consumo,
        descontinuado: !esContinuo,
      };
    });

    gasesDelDia.forEach((gas) => {
      if (gas.psiFinal !== "—") {
        psiFinalAnteriorPorTipo[gas.tipo] = Number(gas.psiFinal);
      }
    });

    console.log("Resultado del día", dia, gasesDelDia);

    resultado.push({
      fecha: dia,
      gases: gasesDelDia,
    });
  });

  tablaGases.value = resultado;
}
</script>
