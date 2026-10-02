<template>
  <div class="container py-3">

    <h5 class="mb-4 text-center fw-semibold">
      Bienvenido, estos son tus recordatorios importantes.
    </h5>

    <div class="row g-3 mb-4">

      <!-- Próximo vencimiento -->
      <div class="col-md-4">
        <div class="card dashboard-card h-100">
          <div class="card-body">

            <div class="dashboard-label">
              Próximo vencimiento
            </div>

            <div class="dashboard-value">
              {{ diasRestantes }}
            </div>

            <div class="dashboard-subtitle">
              días restantes
            </div>

            <hr>

            <div class="small text-muted">
              {{ vencimientoProximo?.nombre || "Sin registros" }}
            </div>

            <div class="fw-semibold">
              {{ vencimientoProximo?.fecha || "-" }}
            </div>

          </div>
        </div>
      </div>

      <!-- Solicitudes -->
      <div class="col-md-4">
        <div class="card dashboard-card h-100">
          <div class="card-body">

            <div class="dashboard-label">
              Solicitudes pendientes
            </div>

            <div class="dashboard-value">
              {{ pendientes }}
            </div>

            <div class="dashboard-subtitle">
              por atender
            </div>

            <hr>

            <div class="small text-muted">
              Solicitudes pendientes de entrega
            </div>

          </div>
        </div>
      </div>

      <!-- Infraestructura -->
      <div class="col-md-4">
        <div class="card dashboard-card h-100">
          <div class="card-body">

            <div class="dashboard-label">
              Infraestructura
            </div>

            <div class="dashboard-value">
              {{ fueraDeServicio }}
            </div>

            <div class="dashboard-subtitle">
              fuera de servicio
            </div>

            <hr>

            <div class="small text-muted">
              Equipos o elementos reportados
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Calendario -->

    <div class="card shadow-sm border-0">
      <div class="card-header bg-white fw-semibold">
        Calendario de vencimientos
      </div>

      <div class="card-body">

        <VueCal
          locale="es"
          :events="eventosLaboratorio"
          default-view="month"
          active-view="month"
          :disable-views="['years', 'week', 'day']"
          style="height: 500px"
          :on-event-click="(evento) => eventoClick(evento)"
        />

      </div>
    </div>

  </div>
</template>


<script setup>
import { ref, onMounted, computed } from "vue";
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
const mostrarCalendario = ref(true);

const diasRestantes = computed(() => {
  if (!vencimientoProximo.value?.fechaReal) return "-";

  return dayjs(vencimientoProximo.value.fechaReal).diff(
    dayjs(),
    "day"
  );
});

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
  fechaReal: primero.fechaVencimiento,
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

.dashboard-card {
  border: none;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  transition: all .2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
}

.dashboard-label {
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #6c757d;
}

.dashboard-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-top: 10px;
}

.dashboard-subtitle {
  color: #6c757d;
  font-size: .9rem;
}

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