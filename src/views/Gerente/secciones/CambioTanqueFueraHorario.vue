<template>
  <div class="card shadow-sm mx-auto" style="max-width: 480px">
    <div class="card-body">
      <h6 class="text-center text-success mb-1">Cambio de tanque</h6>
      <p class="text-center text-muted small mb-3">
        Fuera del horario de reporte. Esto no crea un reporte nuevo; solo queda registrado para que
        el siguiente reporte tenga continuidad.
      </p>
      <p v-if="mensajeHorario" class="alert alert-secondary py-2 small text-center">{{ mensajeHorario }}</p>

      <!-- Cambios ya registrados hoy -->
      <div v-if="cambiosHoy.length" class="mb-3">
        <p class="small fw-semibold mb-1">Ya registrado hoy:</p>
        <ul class="list-group list-group-flush small">
          <li v-for="c in cambiosHoy" :key="c.id" class="list-group-item px-0 py-1">
            <b>{{ c.tipo }}</b> — serie {{ c.serieNueva }}
            <span class="text-muted">· {{ formatoHora(c.fecha) }} ({{ c.turno }}) · {{ c.realizadoPor || 'sin nombre' }}</span>
          </li>
        </ul>
      </div>

      <div class="mb-2">
        <label class="form-label">Gas</label>
        <select v-model="form.tipo" class="form-select">
          <option v-for="tab in tabs" :key="tab" :value="tab">{{ tab }}</option>
        </select>
      </div>

      <div class="mb-2">
        <label class="form-label">Nombre de quien realizó el cambio</label>
        <input v-model="form.realizadoPor" class="form-control" />
      </div>

      <div class="mb-2">
        <label class="form-label">Serie del tanque nuevo</label>
        <input v-model="form.serieNueva" class="form-control" />
      </div>

      <div class="mb-2">
        <label class="form-label">PSI al momento del cambio (opcional)</label>
        <input v-model.number="form.psi" type="number" class="form-control" />
      </div>

      <div class="mb-2">
        <label class="form-label">Fecha y hora del cambio</label>
        <input v-model="form.fechaHora" type="datetime-local" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label">Motivo / notas (opcional)</label>
        <textarea
          v-model="form.motivo"
          class="form-control"
          rows="2"
          placeholder="Ej. se agotó el tanque a media jornada"
        ></textarea>
      </div>

      <button class="btn btn-success w-100" :disabled="guardando" @click="guardarCambio">
        {{ guardando ? "Guardando…" : "Guardar cambio" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import {
  collection, query, where, orderBy, getDocs, addDoc, getFirestore,
} from "firebase/firestore";
import dayjs from "dayjs";
import Swal from "sweetalert2";

const props = defineProps({
  centroId: { type: String, required: true },
  mensajeHorario: { type: String, default: "" },
});

const db = getFirestore();
const CAMBIOS_COLLECTION = "cambiosTanque";
const tabs = ["Baja", "Media", "Cero"];

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const form = ref({ tipo: "Baja", serieNueva: "", psi: null, motivo: "", realizadoPor: "", fechaHora: nowForInput() });
const cambiosHoy = ref([]);
const guardando = ref(false);

const formatoHora = (f) => dayjs(f).format("HH:mm");

async function cargarCambiosHoy() {
  if (!props.centroId) return;
  const inicioDia = dayjs().startOf("day").toISOString();
  const q = query(
    collection(db, CAMBIOS_COLLECTION),
    where("centroId", "==", props.centroId),
    where("fecha", ">=", inicioDia),
    orderBy("fecha", "desc")
  );
  const snap = await getDocs(q);
  cambiosHoy.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

onMounted(cargarCambiosHoy);
watch(() => props.centroId, cargarCambiosHoy);

async function guardarCambio() {
  if (!form.value.serieNueva?.trim()) {
    Swal.fire("Falta la serie", "Anota la serie del tanque nuevo", "warning");
    return;
  }
  if (!form.value.realizadoPor?.trim()) {
    Swal.fire("Falta el nombre", "Anota quién realizó el cambio", "warning");
    return;
  }
  if (!form.value.fechaHora) {
    Swal.fire("Falta la fecha y hora", "Indica cuándo se hizo el cambio", "warning");
    return;
  }

  // El turno se calcula con la hora que indicó el usuario, no con la hora en
  // que se guarda, por si registra el cambio un rato después de que ocurrió.
  const momento = dayjs(form.value.fechaHora);
  const turno = momento.hour() < 13 ? "Mañana" : "Tarde";

  const data = {
    centroId: props.centroId,
    tipo: form.value.tipo,
    serieNueva: form.value.serieNueva.trim(),
    psi: form.value.psi ?? null,
    motivo: form.value.motivo || "",
    realizadoPor: form.value.realizadoPor.trim(),
    turno,
    fecha: momento.toISOString(),
  };

  guardando.value = true;
  try {
    await addDoc(collection(db, CAMBIOS_COLLECTION), data);
    form.value = { tipo: form.value.tipo, serieNueva: "", psi: null, motivo: "", realizadoPor: "", fechaHora: nowForInput() };
    await cargarCambiosHoy();
    Swal.fire({ icon: "success", title: "Cambio registrado", timer: 1500, showConfirmButton: false });
  } catch (e) {
    Swal.fire("No se pudo guardar", e.message, "error");
  } finally {
    guardando.value = false;
  }
}
</script>
