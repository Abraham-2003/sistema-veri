<template>
  <div class="container py-4">
    <h3 class="mb-3">Reporte Diario - {{ ubicacionCentro }}</h3>

    <div class="mb-4">
      <label class="form-label">Selecciona fecha</label>
      <input
        type="date"
        class="form-control"
        v-model="fechaSeleccionada"
        @change="consultarReporte"
      />
    </div>

    <div v-if="loading" class="text-center text-muted">Cargando reporte...</div>
    <div v-else-if="!reporte" class="alert alert-warning">
      No se encontró reporte para la fecha seleccionada.
    </div>
    <div v-else class="accordion" id="reporteCollapse">
      <!-- Calibraciones -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingCalibraciones">
          <button
            class="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseCalibraciones"
          >
            🔧 Calibraciones
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
                  <th>Estación Meteorológica</th>
                  <th>Tacómetros</th>
                  <th>Manómetros</th>
                  <th>Opacímetro</th>
                  <th>Tacómetro Óptico</th>
                  <th>Termocopla</th>
                  <th>Filtro Opacidad</th>
                  <th>Pesas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(equipos, linea) in reporte.calibraciones" :key="linea">
                  <td>
                    <strong>{{ linea }}</strong>
                  </td>
                  <td
                    v-for="equipo in [
                      'Analizador Gases',
                      'Dinamómetros',
                      'Estación Meteorológica',
                      'Tacómetros',
                      'Manómetros',
                      'Opacímetro',
                      'Tacómetro Óptico',
                      'Termocopla',
                      'Filtro Opacidad',
                      'Pesas',
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
            🧪 Gases
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
                <tr v-for="(gas, i) in reporte.gases.gasesUso" :key="'uso-' + i">
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
                <tr v-for="(gas, i) in reporte.gases.gasesStock" :key="'stock-' + i">
                  <td>{{ gas.tipo }}</td>
                  <td>{{ gas.serie }}</td>
                  <td>{{ gas.psi }}</td>
                  <td>{{ gas.estatus }}</td>
                  <td>{{ gas.reporte }}</td>
                  <td>{{ gas.observaciones }}</td>
                </tr>
              </tbody>
            </table>
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
            💨 Compresor
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
                  <th>Limpieza</th>
                  <th>Nivel de Aceite</th>
                  <th>Serie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ reporte.compresor.estatus }}</td>
                  <td>{{ reporte.compresor.observaciones }}</td>
                  <td>{{ reporte.compresor.limpieza }}</td>
                  <td>{{ reporte.compresor.nivelAceite }}</td>
                  <td>{{ reporte.compresor.serie }}</td>
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
            📈 Líneas
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
      <th>Reporte de falla</th>
      <th>Dual</th>
      <th>#Reporte</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(datos, linea) in reporte.lineas" :key="linea">
      <td><strong>{{ linea }}</strong></td>
      <td>{{ datos.estado }}</td>
      <td>{{ datos.reporteFalla }}</td>
      <td>
        <div
          :class="datos.dual ? 'bg-success' : 'bg-grey'"
          style="width: 16px; height: 16px; margin: auto; border-radius: 3px;"
        ></div>
      </td>
      <td>{{ datos.numeroReporte }}</td>
    </tr>
  </tbody>
</table>

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
            📍 Tacómetros
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
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(datos, linea) in reporte.tacometros" :key="linea">
                  <td>
                    <strong>{{ linea }}</strong>
                  </td>
                  <td>
                    <div
                      :class="datos.Pinza ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                  <td>
                    <div
                      :class="datos.OBD ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                  <td>
                    <div
                      :class="datos.Batería ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                  <td>
                    <div
                      :class="datos.Encendedor ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                  <td>
                    <div
                      :class="datos.Contacto ? 'bg-success' : 'bg-danger'"
                      style="width: 16px; height: 16px; margin: auto; border-radius: 3px"
                    ></div>
                  </td>
                  <td>{{ datos.observaciones }}</td>
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
            📝 Observaciones
          </button>
        </h2>
        <div
          id="collapseObservaciones"
          class="accordion-collapse collapse"
          data-bs-parent="#reporteCollapse"
        >
          <div class="accordion-body">
            {{ reporte.observaciones }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
const centroId = ref(null);

const obtenerCentroId = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  const centroDoc = snapshot.docs.find(
    (doc) => doc.data().ubicacion === route.params.ubicacion
  );
  centroId.value = centroDoc ? centroDoc.id : null;
  console.log("[📌 Centro encontrado]", centroId.value);
};

const route = useRoute();
const ubicacionCentro = route.params.ubicacion;
const fechaSeleccionada = ref(dayjs().format("YYYY-MM-DD"));
const reporte = ref(null);
const loading = ref(false);

const consultarReporte = async () => {
  if (!centroId.value) return;

  const q = query(
    collection(db, "reportes"),
    where("centroId", "==", centroId.value),
    where("fecha", "==", fechaSeleccionada.value)
  );

  const snapshot = await getDocs(q);
  reporte.value = snapshot.empty ? null : snapshot.docs[0].data();
};

onMounted(async () => {
  await obtenerCentroId();
  await consultarReporte();
});
</script>
