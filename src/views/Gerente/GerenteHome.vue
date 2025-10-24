<template>
  <div class="container py-3">
    <h5 class="mb-4 text-dark-emphasis text-center fw-semibold">
      Bienvenido, estos son tus recordatorios importantes
    </h5>

    <div class="row g-3">

      <!-- Vencimiento más próximo -->
      <div class="col-12">
        <div class="card border-start border-3 border-primary-subtle shadow-sm">
          <div class="card-body py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <div class="text-primary fw-semibold mb-1">Próximo vencimiento</div>
              <div class="small text-muted">
                {{ vencimientoProximo?.nombre || "—" }}
                <strong>{{ vencimientoProximo?.fecha || "—" }}</strong>
              </div>
            </div>
            <button
              class="btn btn-sm btn-outline-primary rounded-pill"
              @click="mostrarCalendario = !mostrarCalendario"
            >
              <i class="bi bi-calendar-event me-1"></i> Ver calendario
            </button>
          </div>
        </div>

        <transition name="fade">
          <VueCal
          locale="es"
          v-if="mostrarCalendario"
          :events="eventosLaboratorio"
          default-view="month"
          active-view="month"
          :disable-views="['years', 'week', 'day']"
          style="height: 400px"
          :on-event-click="(evento) => eventoClick(evento)"
        />
        </transition>
      </div>

      <!-- Solicitudes pendientes -->
      <div class="col-12">
        <div class="card border-start border-3 border-warning-subtle shadow-sm">
          <div class="card-body py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <div class="text-warning fw-semibold mb-1">Solicitudes pendientes</div>
              <div class="small text-muted">
                Tienes <strong>{{ pendientes }}</strong> en espera de entrega
              </div>
            </div>
            <span class="badge bg-warning text-dark px-3 py-2 rounded-pill">
              {{ pendientes }}
            </span>
          </div>
        </div>
      </div>

      <!-- Infraestructura fuera de servicio -->
      <div class="col-12">
        <div class="card border-start border-3 border-danger-subtle shadow-sm">
          <div class="card-body py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <div class="text-danger fw-semibold mb-1">Infraestructura fuera de servicio</div>
              <div class="small text-muted">
                Tienes <strong>{{ fueraDeServicio }}</strong> elementos reportados
              </div>
            </div>
            <span class="badge bg-danger text-white px-3 py-2 rounded-pill">
              {{ fueraDeServicio }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";

dayjs.locale("es");

const user = JSON.parse(localStorage.getItem("user"));
const usuarioId = user?.id || user?.uid || null;
const centroId = user?.centroId || user?.idCentro || null;

const pendientes = ref(0);
const fueraDeServicio = ref(0);
const vencimientos = ref([]);

async function cargarSolicitudesPendientes() {
  if (!centroId) return;

  const q = query(
    collection(db, "solicitudes"),
    where("centroId", "==", centroId),
    where("estatus", "==", "Pendiente")
  );

  const snapshot = await getDocs(q);
  pendientes.value = snapshot.size;
}

async function cargarInfraestructuraCentro() {
  if (!centroId) return;
  const q = query(
    collection(db, "infraestructura"),
    where("centroId", "==", centroId),
    where("estatus", "==", "Fuera de servicio")
  );
  const snapshot = await getDocs(q);
  fueraDeServicio.value = snapshot.size;
}
function parseFecha(fechaRaw) {
  if (fechaRaw instanceof Date) return fechaRaw;

  if (typeof fechaRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) {
    return dayjs(fechaRaw, "YYYY-MM-DD").toDate();
  }

  if (fechaRaw?.toDate) return fechaRaw.toDate();

  console.warn("⚠️ Fecha no reconocida:", fechaRaw);
  return null;
}

const vencimientoProximo = ref(null);
const eventosLaboratorio = ref([]);
const mostrarCalendario = ref(false);

async function cargarVencimientos() {
  if (!centroId) {
    console.warn("[⚠️ No se encontró centroId]");
    return;
  }


  const q = query(collection(db, "ReporteLab"), where("centroId", "==", centroId));

  const snapshot = await getDocs(q);

  const vencimientos = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const fechaRaw = data.vencimiento;

    if (fechaRaw) {
      const fecha = dayjs(fechaRaw, "YYYY-MM-DD").toDate();
      vencimientos.push({
        nombre: data.tipo || data.folio || "Sin nombre",
        fechaVencimiento: fecha,
      });
    }
  });

const hoy = dayjs().startOf("day");

const ordenados = vencimientos
  .filter((lab) => lab.fechaVencimiento && dayjs(lab.fechaVencimiento).isAfter(hoy)) // 👉 solo fechas futuras
  .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

if (ordenados.length) {
  const primero = ordenados[0];
  vencimientoProximo.value = {
    nombre: primero.nombre,
    fecha: dayjs(primero.fechaVencimiento).format("DD [de] MMMM"),
  };
} else {
  vencimientoProximo.value = {
    nombre: "Sin próximos vencimientos",
    fecha: "-",
  };
  console.log("[✅ No hay próximos vencimientos]");
}


  eventosLaboratorio.value = ordenados
    .map((lab) => {
      if (!lab.fechaVencimiento) return null;

      const fecha = new Date(lab.fechaVencimiento);

      if (isNaN(fecha)) {
        console.warn("[⚠️ Fecha inválida en laboratorio]", lab.fechaVencimiento);
        return null;
      }

      const evento = {
        start: fecha,
        end: new Date(fecha.getTime() + 24 * 60 * 60 * 1000), 
        title: `Vence: ${lab.nombre}`,
        content: `Vencimiento el ${dayjs(fecha).format("DD MMMM")}`,
        class: "vencimiento-evento",
      };

      return evento;
    })
    .filter(Boolean);

}

function eventoClick(evento) {
  alert(evento.content);
}

onMounted(() => {
  cargarSolicitudesPendientes();
  cargarInfraestructuraCentro();
  cargarVencimientos();
});
</script>
<style>
.vuecal__event.vencimiento-evento {
  background-color: #dc3545 !important;
  color: white !important;
  border-radius: 6px;
  padding: 2px 4px;
  font-size: 12px;
}
.vuecal__cell--has-events {
  background-color: #ffe5e5 !important;
}
</style>
