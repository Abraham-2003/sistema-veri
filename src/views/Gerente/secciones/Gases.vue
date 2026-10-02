<template>
  <div>
    <h6 class="text-center mb-3 text-success">Gases</h6>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item" v-for="tab in tabs" :key="tab">
        <button
          class="nav-link"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </li>
    </ul>

    <div v-if="activeTab">
      <!-- EN USO -->
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title">{{ activeTab }} - En uso</h6>

          <!-- Aviso si hubo un cambio de tanque fuera de horario, aún no reflejado en un reporte -->
          <div v-if="props.cambiosPendientes[activeTab]" class="alert alert-info py-2 small">
            Se registró un cambio de tanque el {{ formatoFecha(props.cambiosPendientes[activeTab].fecha) }}
            ({{ props.cambiosPendientes[activeTab].turno }}), realizado por
            <b>{{ props.cambiosPendientes[activeTab].realizadoPor || 'sin nombre registrado' }}</b>
            — nueva serie: <b>{{ props.cambiosPendientes[activeTab].serieNueva }}</b>.
            Ya se marcó como reemplazo en este reporte.
          </div>

          <div
            v-for="(gas, index) in gasesUso[activeTab]"
            :key="`uso-${activeTab}-${index}`"
            class="mb-3 border-bottom pb-3"
          >
            <input type="hidden" v-model="gas.tipo" />

            <div class="mb-2">
              <label class="form-label">Serie</label>
              <input v-model="gas.serie" class="form-control" />
            </div>

            <!-- FALLA DE MANÓMETRO -->
            <div class="form-check mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="gas.falloManometro"
                :id="`falla-${activeTab}`"
              />
              <label class="form-check-label" :for="`falla-${activeTab}`">
                <i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                Falla de manómetro (la lectura de psi no es confiable)
              </label>
            </div>

            <div v-if="!gas.falloManometro" class="mb-2">
              <label class="form-label">PSI</label>
              <input v-model.number="gas.psi" type="number" class="form-control" />
              <div v-if="baseline[activeTab]" class="form-text">
                Reporte anterior: {{ baseline[activeTab].psi ?? 'sin dato' }} psi
                <span v-if="baseline[activeTab].serie">(serie {{ baseline[activeTab].serie }})</span>
              </div>
            </div>

            <div v-else class="mb-2">
              <label class="form-label">Número de reporte</label>
              <input
                v-model="gas.numeroReporteFalla"
                class="form-control"
                placeholder="Folio del reporte de falla del manómetro"
              />
              <div class="form-text">
                Como el manómetro puede marcar una cantidad que no es real, anota aquí el número de
                reporte en lugar del psi.
              </div>
            </div>

            <!-- REEMPLAZO -->
            <div class="form-check mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="gas.reemplazo"
                @change="onReemplazoToggle(activeTab)"
                :id="`reemplazo-${activeTab}`"
              />
              <label class="form-check-label text-danger fw-semibold" :for="`reemplazo-${activeTab}`">
                Reemplazo de gas
              </label>
            </div>

            <div v-if="gas.reemplazo" class="alert alert-warning py-2 small mb-2">
              Marca esto solo si el tanque fue cambiado físicamente. Un tanque de reemplazo normalmente
              marca 2000 psi o más; si marca menos, el sistema te va a preguntar si quieres continuar.
            </div>

            <div v-if="gas.reemplazo" class="mb-2">
              <label class="form-label">Nombre de quien reemplazó el gas</label>
              <input v-model="gas.reemplazoPor" class="form-control" />
            </div>

            <div v-if="gas.reemplazo" class="mb-2">
              <label class="form-label">Fecha y hora del reemplazo</label>
              <input v-model="gas.reemplazoFechaHora" type="datetime-local" class="form-control" />
            </div>

            <div class="mb-2">
              <label class="form-label">Estatus</label>
              <select v-model="gas.estatus" class="form-select">
                <option disabled value="">Selecciona estatus</option>
                <option>En uso</option>
                <option>Agotado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- EN STOCK (SIN VALIDACIÓN) -->
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <h6 class="card-title">{{ activeTab }} - En stock</h6>

          <div
            v-for="(gas, index) in gasesStock[activeTab]"
            :key="`stock-${activeTab}-${index}`"
            class="mb-3 border-bottom pb-2"
          >
            <input type="hidden" v-model="gas.tipo" />

            <div class="mb-2">
              <label class="form-label">Serie</label>
              <input v-model="gas.serie" class="form-control" />
            </div>

            <div class="mb-2">
              <label class="form-label">PSI</label>
              <input v-model.number="gas.psi" type="number" class="form-control" />
            </div>

            <div class="mb-2">
              <label class="form-label">Estatus</label>
              <select v-model="gas.estatus" class="form-select">
                <option disabled value="">Selecciona estatus</option>
                <option>Lleno</option>
                <option>Agotado</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-light border border-secondary-subtle text-secondary fw-semibold px-4 py-2 rounded-pill shadow-sm d-block mx-auto mb-2"
        @click="emitirSiguiente"
      >
        Imágenes <i class="bi bi-arrow-right-circle me-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import Swal from "sweetalert2";

const props = defineProps({
  modelValue: { type: Object, required: true },
  centroId: { type: String, required: true },
  // El padre (ReporteDiario) es quien consulta Firestore; este componente
  // solo recibe la continuidad ya resuelta.
  ultimoReporte: { type: Object, default: null },
  cambiosPendientes: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:modelValue", "siguiente"]);

const REEMPLAZO_MIN_PSI = 2000;
const tabs = ["Baja", "Media", "Cero"];
const activeTab = ref("Baja");

const gasesUso = ref({
  Baja: [{ tipo: "Baja - Uso", serie: "", psi: null, estatus: "", reemplazo: false, falloManometro: false, numeroReporteFalla: "", reemplazoPor: "", reemplazoFechaHora: "" }],
  Media: [{ tipo: "Media - Uso", serie: "", psi: null, estatus: "", reemplazo: false, falloManometro: false, numeroReporteFalla: "", reemplazoPor: "", reemplazoFechaHora: "" }],
  Cero: [{ tipo: "Cero - Uso", serie: "", psi: null, estatus: "", reemplazo: false, falloManometro: false, numeroReporteFalla: "", reemplazoPor: "", reemplazoFechaHora: "" }],
});

const gasesStock = ref({
  Baja: [{ tipo: "Baja - Stock", serie: "", psi: null, estatus: "" }],
  Media: [{ tipo: "Media - Stock", serie: "", psi: null, estatus: "" }],
  Cero: [{ tipo: "Cero - Stock", serie: "", psi: null, estatus: "" }],
});

const formatoFecha = (f) => dayjs(f).format("DD MMM, HH:mm");

// Línea base para prellenar y validar: si el padre trae un cambio de tanque
// fuera de horario posterior al último reporte, ese manda; si no, el reporte anterior.
const baseline = computed(() => {
  const b = {};
  tabs.forEach((tipo) => {
    const cambio = props.cambiosPendientes?.[tipo];
    if (cambio) {
      b[tipo] = { psi: cambio.psi ?? null, serie: cambio.serieNueva || "", origen: "cambio" };
      return;
    }
    const anterior = props.ultimoReporte?.gases?.uso?.[tipo]?.[0];
    b[tipo] = anterior ? { psi: anterior.psi ?? null, serie: anterior.serie || "", origen: "reporte" } : null;
  });
  return b;
});

watch(
  () => [props.ultimoReporte, props.cambiosPendientes],
  () => {
    const anteriorStock = props.ultimoReporte?.gases?.stock || {};
    tabs.forEach((tipo) => {
      const base = baseline.value[tipo];
      if (base) {
        gasesUso.value[tipo][0].serie = base.serie || "";
        if (base.origen === "cambio") gasesUso.value[tipo][0].reemplazo = true;
      }
      if (anteriorStock[tipo]?.[0]) {
        gasesStock.value[tipo][0].serie = anteriorStock[tipo][0].serie || "";
      }
    });
  },
  { immediate: true, deep: true }
);

function validarCongruencia() {
  if (!props.ultimoReporte) return true;

  for (const tipo of tabs) {
    const actual = gasesUso.value[tipo][0];
    const base = baseline.value[tipo];
    if (!base || actual.falloManometro) continue;

    const mismaSerie = (actual.serie || "").trim() === (base.serie || "").trim();

    if (mismaSerie && actual.psi !== null && base.psi !== null && actual.psi > base.psi && !actual.reemplazo) {
      Swal.fire({
        icon: "warning",
        title: `Gas ${tipo}: la lectura subió sin reemplazo`,
        html: `
          <div class="text-start">
            <p>Cantidad anterior: <b>${base.psi} psi</b>${base.serie ? ` (serie ${base.serie})` : ""}.</p>
            <p>Cantidad capturada ahora: <b>${actual.psi} psi</b>.</p>
            <p class="mb-0">Si cambiaste el tanque, marca <b>Reemplazo de gas</b>. Si el manómetro está
            fallando, marca <b>Falla de manómetro</b> y anota el número de reporte.</p>
          </div>
        `,
      });
      return false;
    }
  }
  return true;
}

async function validarReemplazos() {
  for (const tipo of tabs) {
    const actual = gasesUso.value[tipo][0];
    if (!actual.reemplazo || actual.falloManometro || actual.psi === null) continue;
    if (actual.psi < REEMPLAZO_MIN_PSI) {
      const r = await Swal.fire({
        icon: "warning",
        title: `Gas ${tipo}: el tanque de reemplazo marca menos de ${REEMPLAZO_MIN_PSI} psi`,
        html: `Marca <b>${actual.psi} psi</b>. Un tanque nuevo normalmente marca ${REEMPLAZO_MIN_PSI} psi o más.`,
        showCancelButton: true,
        confirmButtonText: "Continuar así",
        cancelButtonText: "Corregir",
      });
      if (!r.isConfirmed) return false;
    }
  }
  return true;
}

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function onReemplazoToggle(tipo) {
  const g = gasesUso.value[tipo][0];
  if (g.reemplazo) {
    if (!g.reemplazoFechaHora) g.reemplazoFechaHora = nowForInput();
  } else {
    g.reemplazoPor = "";
    g.reemplazoFechaHora = "";
  }
}

function validarCampos() {
  return tabs.every((tab) =>
    gasesUso.value[tab].every((g) => {
      const base = g.serie && g.estatus && (g.falloManometro ? g.numeroReporteFalla?.trim() : g.psi !== null);
      const datosReemplazo = !g.reemplazo || (g.reemplazoPor?.trim() && g.reemplazoFechaHora);
      return base && datosReemplazo;
    })
  );
}

async function emitirSiguiente() {
  if (!validarCampos()) {
    Swal.fire("Campos incompletos", "Llena todos los datos", "warning");
    return;
  }
  if (!validarCongruencia()) return;
  if (!(await validarReemplazos())) return;

  // Convierte la fecha/hora del reemplazo (formato del input) a ISO, igual que
  // el resto de las fechas del reporte.
  const usoParaGuardar = {};
  tabs.forEach((tipo) => {
    usoParaGuardar[tipo] = gasesUso.value[tipo].map((g) => ({
      ...g,
      reemplazoFechaHora: g.reemplazo && g.reemplazoFechaHora ? new Date(g.reemplazoFechaHora).toISOString() : "",
    }));
  });

  emit("update:modelValue", { uso: usoParaGuardar, stock: gasesStock.value });
  emit("siguiente");
}
</script>
