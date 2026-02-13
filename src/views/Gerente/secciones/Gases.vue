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

            <div class="mb-2">
              <label class="form-label">PSI</label>
              <input v-model.number="gas.psi" type="number" class="form-control" />
            </div>

            <!-- REEMPLAZO -->
            <div class="form-check mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="gas.reemplazo"
                :id="`reemplazo-${activeTab}`"
              />
              <label class="form-check-label text-danger fw-semibold">
                Reemplazo de gas
              </label>
            </div>

            <div v-if="gas.reemplazo" class="alert alert-warning py-2 small">
              Marca esto solo si el tanque fue cambiado físicamente.
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
      <!-- Botón siguiente -->
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
import { ref, defineProps, defineEmits, onMounted, watch } from "vue";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../../servivces/auth.js";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  centroId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "siguiente"]);

const tabs = ["Baja", "Media", "Cero"];
const activeTab = ref("Baja");
const ultimoReporte = ref(null);

const gasesUso = ref({
  Baja: [{ tipo: "Baja - Uso", serie: "", psi: null, estatus: "", reemplazo: false }],
  Media: [{ tipo: "Media - Uso", serie: "", psi: null, estatus: "", reemplazo: false }],
  Cero: [{ tipo: "Cero - Uso", serie: "", psi: null, estatus: "", reemplazo: false }],
});

const gasesStock = ref({
  Baja: [{ tipo: "Baja - Stock", serie: "", psi: null, estatus: "" }],
  Media: [{ tipo: "Media - Stock", serie: "", psi: null, estatus: "" }],
  Cero: [{ tipo: "Cero - Stock", serie: "", psi: null, estatus: "" }],
});

watch(
  () => props.centroId,
  async (centroId) => {
    if (!centroId) {
      console.warn("⛔ centroId aún no disponible");
      return;
    }

    const q = query(
      collection(db, "reportes"),
      where("centroId", "==", centroId),
      orderBy("fecha", "desc"),
      limit(1)
    );

    const snap = await getDocs(q);

    ultimoReporte.value = snap.empty ? null : snap.docs[0].data();
  },
  { immediate: true }
);

function validarCongruencia() {
  if (!ultimoReporte.value) return true;

  for (const tipo of tabs) {
    const actual = gasesUso.value[tipo][0];
    const anterior = ultimoReporte.value?.gases?.uso?.[tipo]?.[0];

    if (!anterior) continue;

    if (actual.psi > anterior.psi && !actual.reemplazo) {
      Swal.fire({
        icon: "error",
        title: "Registro incongruente",
        html: `
          <b> Gas ${tipo}</b><br>
          Si hubo cambio de tanque, marca <b>Reemplazo de gas</b>.
        `,
      });
      return false;
    }
  }

  return true;
}

function validarCampos() {
  return tabs.every((tab) =>
    gasesUso.value[tab].every((g) => g.serie && g.psi !== null && g.estatus)
  );
}

function emitirSiguiente() {
  if (!validarCampos()) {
    Swal.fire("Campos incompletos", "Llena todos los datos", "warning");
    return;
  }

  if (!validarCongruencia()) return;

  emit("update:modelValue", { uso: gasesUso.value, stock: gasesStock.value });
  emit("siguiente");
}
</script>
